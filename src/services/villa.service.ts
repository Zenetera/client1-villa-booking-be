import { Prisma } from "@prisma/client";
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
  const { amenitiesEl, ...rest } = data;

  return prisma.villa.update({
    where: { id },
    data: {
      ...rest,
      ...(amenitiesEl !== undefined && {
        amenitiesEl: amenitiesEl === null ? Prisma.JsonNull : amenitiesEl,
      }),
    },
    include: {
      images: { orderBy: { displayOrder: "asc" } },
    },
  });
}
