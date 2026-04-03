import { z } from "zod";

export const createImageSchema = z.object({
  imageUrl: z.string().url("Must be a valid URL"),
  altText: z.string().min(1, "Alt text is required"),
});

export type CreateImageInput = z.infer<typeof createImageSchema>;

export const updateImageSchema = z.object({
  altText: z.string().min(1, "Alt text is required").optional(),
  displayOrder: z.number().int().min(0).optional(),
  isHero: z.boolean().optional(),
});

export type UpdateImageInput = z.infer<typeof updateImageSchema>;

export const reorderImagesSchema = z.object({
  imageIds: z
    .array(z.number().int().positive())
    .min(1, "At least one image ID is required"),
});

export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;
