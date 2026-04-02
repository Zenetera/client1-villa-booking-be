import { z } from "zod";

export const updateVillaSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  shortDescription: z.string().min(1).optional(),
  maxGuests: z.number().int().positive().optional(),
  basePricePerNight: z.number().positive().optional(),
  touristTaxPerNight: z.number().nonnegative().optional(),
  minNights: z.number().int().positive().optional(),
  maxNights: z.number().int().positive().nullable().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  address: z.string().min(1).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  amenities: z.array(z.string()).optional(),
  houseRules: z.string().nullable().optional(),
});

export type UpdateVillaInput = z.infer<typeof updateVillaSchema>;
