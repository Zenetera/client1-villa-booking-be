import { z } from "zod";

export const updateContactSchema = z.object({
  ownerFullName: z.string().min(1, "Required"),
  ownerDisplayName: z.string().min(1, "Required"),
  email: z.string().min(1, "Required").email("Must be a valid email"),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  streetAddress: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  region: z.string().nullable(),
  postalCode: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
});

export type UpdateContactInput = z.infer<typeof updateContactSchema>;

export const contactInquirySchema = z.object({
  name: z.string().min(1, "Required").max(100),
  email: z.string().min(1, "Required").email("Must be a valid email"),
  subject: z.string().min(1, "Required").max(200),
  message: z.string().min(1, "Required").max(5000),
});

export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;
