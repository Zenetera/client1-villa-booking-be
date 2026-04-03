import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const createBlockedDateSchema = z
  .object({
    startDate: dateString,
    endDate: dateString,
    reason: z.string().min(1, "Reason is required"),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export type CreateBlockedDateInput = z.infer<typeof createBlockedDateSchema>;

export const blockedDateQuerySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
});
