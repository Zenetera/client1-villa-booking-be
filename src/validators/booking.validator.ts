import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((value) => {
    const [y, m, d] = value.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === m - 1 &&
      dt.getUTCDate() === d
    );
  }, "Date must be a valid calendar date");

export const createBookingSchema = z
  .object({
    checkIn: dateString,
    checkOut: dateString,
    numGuests: z.number().int().positive("Number of guests must be positive"),
    guestName: z.string().min(1, "Guest name is required"),
    guestEmail: z.string().email("Valid email is required"),
    guestPhone: z.string().min(1, "Phone number is required"),
    guestMessage: z.string().optional(),
  })
  .refine(
    (data) => new Date(data.checkOut) > new Date(data.checkIn),
    { message: "Check-out must be after check-in", path: ["checkOut"] }
  );

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const confirmBookingSchema = z.object({
  adminNotes: z.string().optional(),
});

export type ConfirmBookingInput = z.infer<typeof confirmBookingSchema>;

export const cancelBookingSchema = z.object({
  cancellationReason: z.string().min(1, "Cancellation reason is required"),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

export const calendarQuerySchema = z.object({
  from: dateString,
  to: dateString,
});

export const bookingListQuerySchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "all"]).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(20),
});

export const updateBookingSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  paymentStatus: z.enum(["unpaid", "deposit_paid", "paid"]).optional(),
  adminNotes: z.string().nullable().optional(),
  cancellationReason: z.string().nullable().optional(),
});

export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

export const exportBookingsQuerySchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  from: dateString.optional(),
  to: dateString.optional(),
});
