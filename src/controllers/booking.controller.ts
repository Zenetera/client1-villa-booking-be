import { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import * as bookingService from "../services/booking.service";
import { BookingError } from "../services/booking.service";
import * as statsService from "../services/stats.service";
import {
  createBookingSchema,
  confirmBookingSchema,
  cancelBookingSchema,
  bookingListQuerySchema,
  exportBookingsQuerySchema,
  updateBookingSchema,
} from "../validators/booking.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { serializeBooking } from "../utils/serializeBooking";
import prisma from "../config/database";

// Public

export async function createBooking(req: Request, res: Response) {
  const input = createBookingSchema.parse(req.body);

  const villa = await prisma.villa.findFirst({ select: { id: true } });
  if (!villa) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  try {
    const { booking, pricing } = await bookingService.createBooking(
      villa.id,
      input
    );

    res.status(201).json(
      successResponse({
        booking: serializeBooking(booking),
        pricing: {
          numNights: pricing.numNights,
          nights: pricing.nights.map((n) => ({
            date: n.date,
            price: n.price.toFixed(2),
            ruleName: n.ruleName,
          })),
          accommodationTotal: pricing.accommodationTotal.toFixed(2),
          touristTaxTotal: pricing.touristTaxTotal.toFixed(2),
          totalPrice: pricing.totalPrice.toFixed(2),
        },
      })
    );
  } catch (err) {
    if (err instanceof BookingError) {
      res.status(400).json(errorResponse(err.message, err.field));
      return;
    }
    throw err;
  }
}

export async function getBookingByReference(req: Request, res: Response) {
  const referenceCode = req.params.referenceCode as string;

  const booking = await bookingService.getBookingByReference(referenceCode);
  if (!booking) {
    res.status(404).json(errorResponse("Booking not found"));
    return;
  }

  res.json(successResponse(serializeBooking(booking)));
}

// Admin

export async function listBookings(req: AuthRequest, res: Response) {
  const query = bookingListQuerySchema.parse(req.query);

  const result = await bookingService.listBookings({
    status: query.status,
    search: query.search,
    page: query.page,
    limit: query.limit,
  });

  res.json(
    successResponse({
      bookings: result.bookings.map(serializeBooking),
      pagination: result.pagination,
    })
  );
}

export async function updateBooking(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json(errorResponse("Invalid booking ID", "id"));
    return;
  }

  const body = updateBookingSchema.parse(req.body);

  try {
    const booking = await bookingService.updateBooking(id, body);
    res.json(successResponse(serializeBooking(booking)));
  } catch (err) {
    if (err instanceof BookingError) {
      res.status(400).json(errorResponse(err.message, err.field));
      return;
    }
    throw err;
  }
}

export async function getOverlappingPending(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json(errorResponse("Invalid booking ID", "id"));
    return;
  }
  const overlaps = await bookingService.findOverlappingPending(id);
  res.json(successResponse(overlaps));
}

export async function getBooking(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json(errorResponse("Invalid booking ID", "id"));
    return;
  }

  const booking = await bookingService.getBookingById(id);
  if (!booking) {
    res.status(404).json(errorResponse("Booking not found"));
    return;
  }

  res.json(successResponse(serializeBooking(booking)));
}

export async function confirmBooking(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json(errorResponse("Invalid booking ID", "id"));
    return;
  }

  const body = confirmBookingSchema.parse(req.body);

  try {
    const booking = await bookingService.confirmBooking(id, body.adminNotes);
    res.json(successResponse(booking));
  } catch (err) {
    if (err instanceof BookingError) {
      res.status(400).json(errorResponse(err.message, err.field));
      return;
    }
    throw err;
  }
}

export async function cancelBooking(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json(errorResponse("Invalid booking ID", "id"));
    return;
  }

  const body = cancelBookingSchema.parse(req.body);

  try {
    const booking = await bookingService.cancelBooking(
      id,
      body.cancellationReason
    );
    res.json(successResponse(booking));
  } catch (err) {
    if (err instanceof BookingError) {
      res.status(400).json(errorResponse(err.message, err.field));
      return;
    }
    throw err;
  }
}

export async function completeBooking(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json(errorResponse("Invalid booking ID", "id"));
    return;
  }

  try {
    const booking = await bookingService.completeBooking(id);
    res.json(successResponse(booking));
  } catch (err) {
    if (err instanceof BookingError) {
      res.status(400).json(errorResponse(err.message, err.field));
      return;
    }
    throw err;
  }
}

export async function getStats(_req: AuthRequest, res: Response) {
  const stats = await statsService.getBookingStats();
  res.json(successResponse(stats));
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportBookings(req: AuthRequest, res: Response) {
  const query = exportBookingsQuerySchema.parse(req.query);

  const bookings = await bookingService.exportBookings({
    status: query.status,
    from: query.from,
    to: query.to,
  });

  const headers = [
    "Reference",
    "Status",
    "Payment Status",
    "Guest Name",
    "Guest Email",
    "Guest Phone",
    "Check-in",
    "Check-out",
    "Nights",
    "Guests",
    "Nightly Rate",
    "Tourist Tax",
    "Total Price",
    "Guest Message",
    "Admin Notes",
    "Created At",
  ];

  const rows = bookings.map((b) =>
    [
      b.referenceCode,
      b.status,
      b.paymentStatus,
      csvEscape(b.guestName),
      csvEscape(b.guestEmail),
      csvEscape(b.guestPhone),
      b.checkIn.toISOString().split("T")[0],
      b.checkOut.toISOString().split("T")[0],
      b.numNights,
      b.numGuests,
      b.nightlyRate.toFixed(2),
      b.touristTaxTotal.toFixed(2),
      b.totalPrice.toFixed(2),
      csvEscape(b.guestMessage),
      csvEscape(b.adminNotes),
      b.createdAt.toISOString(),
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="bookings-${new Date().toISOString().split("T")[0]}.csv"`
  );
  res.send(csv);
}
