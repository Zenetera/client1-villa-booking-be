import prisma from "../config/database";
import type { UpdateVillaInput } from "../schemas/villa.schema";

export async function getVilla() {
  return prisma.villa.findFirst({
    include: {
      images: { orderBy: { displayOrder: "asc" } },
    },
  });
}

export async function updateVilla(id: number, data: UpdateVillaInput) {
  return prisma.villa.update({
    where: { id },
    data,
    include: {
      images: { orderBy: { displayOrder: "asc" } },
    },
  });
}
