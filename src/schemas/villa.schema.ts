import { z } from "zod";

export const updateVillaSchema = z.object({
  nameEn: z.string().min(1).optional(),
  nameEl: z.string().min(1).nullable().optional(),
  descriptionEn: z.string().min(1).optional(),
  descriptionEl: z.string().min(1).nullable().optional(),
  shortDescriptionEn: z.string().min(1).optional(),
  shortDescriptionEl: z.string().min(1).nullable().optional(),
  bedrooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  maxGuests: z.number().int().positive().optional(),
  basePricePerNight: z.number().positive().optional(),
  touristTaxPerNight: z.number().nonnegative().optional(),
  depositPercentage: z.number().min(0).max(100).optional(),
  minNights: z.number().int().positive().optional(),
  maxNights: z.number().int().positive().nullable().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  address: z.string().min(1).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  amenitiesEn: z.array(z.string()).optional(),
  amenitiesEl: z.array(z.string()).nullable().optional(),
  houseRulesEn: z.string().nullable().optional(),
  houseRulesEl: z.string().nullable().optional(),
});

export type UpdateVillaInput = z.infer<typeof updateVillaSchema>;
