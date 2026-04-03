import prisma from "../config/database";
import cloudinary from "../config/cloudinary";
import type {
  CreateImageInput,
  UpdateImageInput,
  ReorderImagesInput,
} from "../validators/villaImage.validator";

export async function listImages(villaId: number) {
  return prisma.villaImage.findMany({
    where: { villaId },
    orderBy: { displayOrder: "asc" },
  });
}

export async function createImage(villaId: number, input: CreateImageInput) {
  // Get current max display order
  const maxOrder = await prisma.villaImage.aggregate({
    where: { villaId },
    _max: { displayOrder: true },
  });
  const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  // Check if this is the first image (make it hero)
  const count = await prisma.villaImage.count({ where: { villaId } });

  return prisma.villaImage.create({
    data: {
      villaId,
      imageUrl: input.imageUrl,
      altText: input.altText,
      displayOrder: nextOrder,
      isHero: count === 0,
    },
  });
}

export async function updateImage(
  id: number,
  villaId: number,
  input: UpdateImageInput
) {
  const existing = await prisma.villaImage.findUnique({ where: { id } });
  if (!existing || existing.villaId !== villaId) return null;

  // If setting as hero, unset other hero images
  if (input.isHero === true) {
    await prisma.villaImage.updateMany({
      where: { villaId, isHero: true },
      data: { isHero: false },
    });
  }

  return prisma.villaImage.update({
    where: { id },
    data: {
      ...(input.altText !== undefined && { altText: input.altText }),
      ...(input.displayOrder !== undefined && {
        displayOrder: input.displayOrder,
      }),
      ...(input.isHero !== undefined && { isHero: input.isHero }),
    },
  });
}

export async function reorderImages(
  villaId: number,
  input: ReorderImagesInput
) {
  await prisma.$transaction(
    input.imageIds.map((imageId, index) =>
      prisma.villaImage.updateMany({
        where: { id: imageId, villaId },
        data: { displayOrder: index },
      })
    )
  );

  return prisma.villaImage.findMany({
    where: { villaId },
    orderBy: { displayOrder: "asc" },
  });
}

export async function deleteImage(id: number, villaId: number) {
  const existing = await prisma.villaImage.findUnique({ where: { id } });
  if (!existing || existing.villaId !== villaId) return null;

  // Try to clean up from Cloudinary (best-effort, non-blocking)
  const urlParts = existing.imageUrl.split("/");
  const folderAndFile = urlParts.slice(-2).join("/");
  const publicId = folderAndFile.replace(/\.[^.]+$/, "");

  cloudinary.uploader.destroy(publicId).catch((err) => {
    console.error("Failed to delete image from Cloudinary:", err);
  });

  return prisma.villaImage.delete({ where: { id } });
}
