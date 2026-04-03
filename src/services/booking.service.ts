import { Prisma } from "@prisma/client";
import prisma from "../config/database";
import { generateReferenceCode } from "../utils/referenceCode";
import { calculatePricing } from "./pricing.service";
import { checkAvailability } from "./availability.service";
import * as emailService from "./email.service";
import type { CreateBookingInput } from "../validators/booking.validator";

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

  // Check availability (optimistic, enforced again inside transaction)
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

  // Calculate pricing
  const pricing = await calculatePricing(villaId, checkIn, checkOut);

  // Generate reference code
  const referenceCode = await generateReferenceCode();

  // Build blocked dates for the stay (checkIn to checkOut - 1)
  const blockedDatesData: { villaId: number; date: Date; reason: string }[] = [];
  for (let i = 0; i < numNights; i++) {
    const d = new Date(checkIn.getTime());
    d.setUTCDate(d.getUTCDate() + i);
    blockedDatesData.push({
      villaId,
      date: d,
      reason: `Booking ${referenceCode}`,
    });
  }

  // Create booking + blocked dates in a transaction
  // The unique constraint on blocked_dates(villa_id, date) enforces availability at the DB level
  let booking;
  try {
    booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
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
          status: "pending",
          guestMessage: input.guestMessage || null,
        },
      });

      // Create blocked dates linked to this booking
      // Unique constraint violation here means a concurrent booking claimed the dates
      await tx.blockedDate.createMany({
        data: blockedDatesData.map((bd) => ({
          ...bd,
          bookingId: newBooking.id,
        })),
      });

      return newBooking;
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new BookingError(
        "Selected dates are no longer available",
        "checkIn"
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
    })
    .catch((err) => console.error("Failed to send booking email:", err));

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

  const updated = await prisma.booking.update({
    where: { id, status: "pending" },
    data: {
      status: "confirmed",
      confirmedAt: new Date(),
      adminNotes: adminNotes ?? booking.adminNotes,
    },
  }).catch((err) => {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new BookingError("Booking status has changed, please refresh", "status");
    }
    throw err;
  });

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
  page: number;
  limit: number;
}) {
  const where = opts.status ? { status: opts.status } : {};
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
