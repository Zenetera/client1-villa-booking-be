import { z } from "zod";

export const createSitePageSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens"
    ),
  titleEn: z.string().min(1, "English title is required"),
  titleEl: z.string().nullable().optional(),
  contentEn: z.string().min(1, "English content is required"),
  contentEl: z.string().nullable().optional(),
});

export type CreateSitePageInput = z.infer<typeof createSitePageSchema>;

export const updateSitePageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens"
    )
    .optional(),
  titleEn: z.string().min(1).optional(),
  titleEl: z.string().nullable().optional(),
  contentEn: z.string().min(1).optional(),
  contentEl: z.string().nullable().optional(),
});

export type UpdateSitePageInput = z.infer<typeof updateSitePageSchema>;
