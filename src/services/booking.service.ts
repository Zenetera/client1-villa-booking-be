import { Prisma } from "@prisma/client";
import prisma from "../config/database";
import { generateReferenceCode } from "../utils/referenceCode";
import { calculatePricing } from "./pricing.service";
import { checkAvailability } from "./availability.service";
import * as emailService from "./email.service";
import type {
  CreateBookingInput,
  UpdateBookingInput,
} from "../validators/booking.validator";

function depositDisplay(
  totalPrice: Prisma.Decimal,
  depositAmount: Prisma.Decimal | null
): { depositAmount: string; depositPercentage: string } {
  const amount = depositAmount ?? new Prisma.Decimal(0);
  const pct = totalPrice.gt(0)
    ? amount.div(totalPrice).mul(100)
    : new Prisma.Decimal(0);
  return {
    depositAmount: amount.toFixed(2),
    depositPercentage: pct.toFixed(2),
  };
}

export async function createBooking(villaId: number, input: CreateBookingInput) {
  const checkIn = new Date(input.checkIn);
  const checkOut = new Date(input.checkOut);
  const numNights = Math.round(
    (checkOut.getTime() - checkIn.getTime()) / 86400000
  );

  // Load villa constraints
  const villa = await prisma.villa.findUniqueOrThrow({
    where: { id: villaId },
    select: {
      id: true,
      maxGuests: true,
      minNights: true,
      maxNights: true,
      touristTaxPerNight: true,
    },
  });

  // Validate guest count
  if (input.numGuests > villa.maxGuests) {
    throw new BookingError(
      `Maximum ${villa.maxGuests} guests allowed`,
      "numGuests"
    );
  }

  // Validate night count
  if (numNights < villa.minNights) {
    throw new BookingError(
      `Minimum stay is ${villa.minNights} nights`,
      "checkOut"
    );
  }
  if (villa.maxNights !== null && numNights > villa.maxNights) {
    throw new BookingError(
      `Maximum stay is ${villa.maxNights} nights`,
      "checkOut"
    );
  }

  // Pending bookings only check against admin-blocked / confirmed-booked dates.
  // Multiple pending requests on the same range are allowed.
  const { available, conflictingDates } = await checkAvailability(
    villaId,
    checkIn,
    checkOut
  );
  if (!available) {
    throw new BookingError(
      `Dates unavailable: ${conflictingDates.join(", ")}`,
      "checkIn"
    );
  }

  const pricing = await calculatePricing(villaId, checkIn, checkOut);
  const referenceCode = await generateReferenceCode();

  let booking;
  try {
    booking = await prisma.booking.create({
      data: {
        villaId,
        referenceCode,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        checkIn,
        checkOut,
        numGuests: input.numGuests,
        numNights,
        nightlyRate: pricing.nightlyRate,
        touristTaxTotal: pricing.touristTaxTotal,
        totalPrice: pricing.totalPrice,
        depositAmount: pricing.depositAmount,
        status: "pending",
        guestMessage: input.guestMessage || null,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new BookingError(
        "Failed to generate booking reference, please try again",
        "general"
      );
    }
    throw err;
  }

  // Send confirmation email (don't block on failure)
  emailService
    .sendBookingReceived({
      referenceCode: booking.referenceCode,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      numGuests: booking.numGuests,
      numNights: booking.numNights,
      nightlyRate: pricing.nightlyRate.toFixed(2),
      touristTaxTotal: pricing.touristTaxTotal.toFixed(2),
      totalPrice: pricing.totalPrice.toFixed(2),
      depositAmount: pricing.depositAmount.toFixed(2),
      depositPercentage: pricing.depositPercentage.toFixed(2),
    })
    .catch((err) => console.error("Failed to send booking email:", err));

  // Notify admin of the new request so they can confirm/cancel asap
  emailService
    .sendAdminBookingRequest({
      referenceCode: booking.referenceCode,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      guestMessage: booking.guestMessage,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      numGuests: booking.numGuests,
      numNights: booking.numNights,
      nightlyRate: pricing.nightlyRate.toFixed(2),
      touristTaxTotal: pricing.touristTaxTotal.toFixed(2),
      totalPrice: pricing.totalPrice.toFixed(2),
      depositAmount: pricing.depositAmount.toFixed(2),
      depositPercentage: pricing.depositPercentage.toFixed(2),
    })
    .catch((err) => console.error("Failed to send admin notification email:", err));

  return { booking, pricing };
}

export async function confirmBooking(id: number, adminNotes?: string) {
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id } });

  if (booking.status !== "pending") {
    throw new BookingError(
      `Cannot confirm a booking with status "${booking.status}"`,
      "status"
    );
  }

  const blockedDatesData = buildStayBlockedDates(
    booking.villaId,
    booking.checkIn,
    booking.numNights,
    booking.referenceCode
  );

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      const confirmed = await tx.booking.update({
        where: { id, status: "pending" },
        data: {
          status: "confirmed",
          confirmedAt: new Date(),
          adminNotes: adminNotes ?? booking.adminNotes,
        },
      });

      await tx.blockedDate.createMany({
        data: blockedDatesData.map((bd) => ({ ...bd, bookingId: id })),
      });

      return confirmed;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        throw new BookingError("Booking status has changed, please refresh", "status");
      }
      if (err.code === "P2002") {
        throw new BookingError(
          "Cannot confirm — these dates are already booked or blocked",
          "status"
        );
      }
    }
    throw err;
  }

  emailService
    .sendBookingConfirmed({
      referenceCode: updated.referenceCode,
      guestName: updated.guestName,
      guestEmail: updated.guestEmail,
      checkIn: updated.checkIn.toISOString().split("T")[0],
      checkOut: updated.checkOut.toISOString().split("T")[0],
      numGuests: updated.numGuests,
      numNights: updated.numNights,
      nightlyRate: updated.nightlyRate.toFixed(2),
      touristTaxTotal: updated.touristTaxTotal.toFixed(2),
      totalPrice: updated.totalPrice.toFixed(2),
      ...depositDisplay(updated.totalPrice, updated.depositAmount),
    })
    .catch((err) => console.error("Failed to send confirmation email:", err));

  return updated;
}

export async function cancelBooking(id: number, cancellationReason: string) {
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id } });

  if (booking.status === "cancelled" || booking.status === "completed") {
    throw new BookingError(
      `Cannot cancel a booking with status "${booking.status}"`,
      "status"
    );
  }

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.booking.update({
        where: { id, status: booking.status },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancellationReason,
        },
      });

      // Remove blocked dates for this booking
      await tx.blockedDate.deleteMany({
        where: { bookingId: id },
      });

      return cancelled;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new BookingError("Booking status has changed, please refresh", "status");
    }
    throw err;
  }

  emailService
    .sendBookingCancelled(
      {
        referenceCode: updated.referenceCode,
        guestName: updated.guestName,
        guestEmail: updated.guestEmail,
        checkIn: updated.checkIn.toISOString().split("T")[0],
        checkOut: updated.checkOut.toISOString().split("T")[0],
      },
      cancellationReason
    )
    .catch((err) => console.error("Failed to send cancellation email:", err));

  return updated;
}

export async function completeBooking(id: number) {
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id } });

  if (booking.status !== "confirmed") {
    throw new BookingError(
      `Cannot complete a booking with status "${booking.status}"`,
      "status"
    );
  }

  return prisma.booking.update({
    where: { id, status: "confirmed" },
    data: { status: "completed" },
  }).catch((err) => {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new BookingError("Booking status has changed, please refresh", "status");
    }
    throw err;
  });
}

export async function getBookingByReference(referenceCode: string) {
  return prisma.booking.findUnique({
    where: { referenceCode },
    include: { villa: { select: { nameEn: true, address: true, checkInTime: true, checkOutTime: true } } },
  });
}

export async function getBookingById(id: number) {
  return prisma.booking.findUnique({
    where: { id },
    include: { villa: { select: { nameEn: true, address: true, checkInTime: true, checkOutTime: true } } },
  });
}

export async function listBookings(opts: {
  status?: string;
  search?: string;
  page: number;
  limit: number;
}) {
  const where: Prisma.BookingWhereInput = {};
  if (opts.status && opts.status !== "all") {
    where.status = opts.status;
  }
  if (opts.search) {
    where.OR = [
      { guestName: { contains: opts.search, mode: "insensitive" } },
      { referenceCode: { contains: opts.search, mode: "insensitive" } },
      { guestEmail: { contains: opts.search, mode: "insensitive" } },
    ];
  }
  const skip = (opts.page - 1) * opts.limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: opts.limit,
      include: { villa: { select: { nameEn: true } } },
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    pagination: {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.ceil(total / opts.limit),
    },
  };
}

export async function updateBooking(id: number, input: UpdateBookingInput) {
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id } });

  const isStatusChanging = input.status !== undefined && input.status !== booking.status;

  // Validate status transitions
  if (isStatusChanging) {
    const from = booking.status;
    const to = input.status!;
    const allowed: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };
    if (!allowed[from]?.includes(to)) {
      throw new BookingError(
        `Cannot change status from "${from}" to "${to}"`,
        "status"
      );
    }
  }

  const data: Prisma.BookingUpdateInput = {};
  if (input.status !== undefined) data.status = input.status;
  if (input.paymentStatus !== undefined) data.paymentStatus = input.paymentStatus;
  if (input.adminNotes !== undefined) data.adminNotes = input.adminNotes;
  if (input.cancellationReason !== undefined)
    data.cancellationReason = input.cancellationReason;

  if (isStatusChanging && input.status === "confirmed") {
    data.confirmedAt = new Date();
  }
  if (isStatusChanging && input.status === "cancelled") {
    data.cancelledAt = new Date();
  }

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      const result = await tx.booking.update({
        where: { id, status: booking.status },
        data,
      });

      if (isStatusChanging && input.status === "confirmed") {
        const blockedDatesData = buildStayBlockedDates(
          booking.villaId,
          booking.checkIn,
          booking.numNights,
          booking.referenceCode
        );
        await tx.blockedDate.createMany({
          data: blockedDatesData.map((bd) => ({ ...bd, bookingId: id })),
        });
      }

      if (isStatusChanging && input.status === "cancelled") {
        await tx.blockedDate.deleteMany({ where: { bookingId: id } });
      }

      return result;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        throw new BookingError("Booking has changed, please refresh", "status");
      }
      if (err.code === "P2002") {
        throw new BookingError(
          "Cannot confirm — these dates are already booked or blocked",
          "status"
        );
      }
    }
    throw err;
  }

  // Fire-and-forget emails on confirm/cancel transitions
  if (isStatusChanging && input.status === "confirmed") {
    emailService
      .sendBookingConfirmed({
        referenceCode: updated.referenceCode,
        guestName: updated.guestName,
        guestEmail: updated.guestEmail,
        checkIn: updated.checkIn.toISOString().split("T")[0],
        checkOut: updated.checkOut.toISOString().split("T")[0],
        numGuests: updated.numGuests,
        numNights: updated.numNights,
        nightlyRate: updated.nightlyRate.toFixed(2),
        touristTaxTotal: updated.touristTaxTotal.toFixed(2),
        totalPrice: updated.totalPrice.toFixed(2),
        ...depositDisplay(updated.totalPrice, updated.depositAmount),
      })
      .catch((err) => console.error("Failed to send confirmation email:", err));
  }
  if (isStatusChanging && input.status === "cancelled") {
    emailService
      .sendBookingCancelled(
        {
          referenceCode: updated.referenceCode,
          guestName: updated.guestName,
          guestEmail: updated.guestEmail,
          checkIn: updated.checkIn.toISOString().split("T")[0],
          checkOut: updated.checkOut.toISOString().split("T")[0],
        },
        updated.cancellationReason || "Cancelled by admin"
      )
      .catch((err) => console.error("Failed to send cancellation email:", err));
  }

  return updated;
}

export async function findOverlappingPending(id: number) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return [];

  const lastNight = new Date(booking.checkOut.getTime());
  lastNight.setUTCDate(lastNight.getUTCDate() - 1);

  return prisma.booking.findMany({
    where: {
      id: { not: id },
      villaId: booking.villaId,
      status: "pending",
      checkIn: { lte: lastNight },
      checkOut: { gt: booking.checkIn },
    },
    select: {
      id: true,
      referenceCode: true,
      guestName: true,
      checkIn: true,
      checkOut: true,
    },
  });
}

function buildStayBlockedDates(
  villaId: number,
  checkIn: Date,
  numNights: number,
  referenceCode: string
) {
  const dates: { villaId: number; date: Date; reason: string }[] = [];
  for (let i = 0; i < numNights; i++) {
    const d = new Date(checkIn.getTime());
    d.setUTCDate(d.getUTCDate() + i);
    dates.push({ villaId, date: d, reason: `Booking ${referenceCode}` });
  }
  return dates;
}

export async function exportBookings(opts: {
  status?: string;
  from?: string;
  to?: string;
}) {
  const where = {
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.from || opts.to
      ? {
          checkIn: {
            ...(opts.from ? { gte: new Date(opts.from) } : {}),
            ...(opts.to ? { lte: new Date(opts.to) } : {}),
          },
        }
      : {}),
  };

  return prisma.booking.findMany({
    where,
    orderBy: { checkIn: "asc" },
  });
}

// Custom error class for booking validation errors
export class BookingError extends Error {
  field: string;
  constructor(message: string, field: string) {
    super(message);
    this.name = "BookingError";
    this.field = field;
  }
}
