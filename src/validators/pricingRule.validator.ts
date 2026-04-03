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

export const createPricingRuleSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    startDate: dateString,
    endDate: dateString,
    pricePerNight: z.number().positive("Price per night must be positive"),
    minNights: z.number().int().positive().nullable().optional(),
    priority: z.number().int().min(0).default(0),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export type CreatePricingRuleInput = z.infer<typeof createPricingRuleSchema>;

export const updatePricingRuleSchema = z
  .object({
    name: z.string().min(1).optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    pricePerNight: z.number().positive().optional(),
    minNights: z.number().int().positive().nullable().optional(),
    priority: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    { message: "End date must be on or after start date", path: ["endDate"] }
  );

export type UpdatePricingRuleInput = z.infer<typeof updatePricingRuleSchema>;
