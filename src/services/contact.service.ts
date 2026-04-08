import prisma from "../config/database";
import type { UpdateContactInput } from "../validators/contact.validator";

export async function getContactInfo() {
  const villa = await prisma.villa.findFirst({ select: { id: true } });
  if (!villa) return null;

  return prisma.contactInfo.findUnique({
    where: { villaId: villa.id },
  });
}

export async function updateContactInfo(data: UpdateContactInput) {
  const villa = await prisma.villa.findFirst({ select: { id: true } });
  if (!villa) return null;

  return prisma.contactInfo.upsert({
    where: { villaId: villa.id },
    update: data,
    create: { villaId: villa.id, ...data },
  });
}
