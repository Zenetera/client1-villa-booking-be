import { Prisma } from "@prisma/client";
import prisma from "../config/database";
import type {
  CreateSitePageInput,
  UpdateSitePageInput,
} from "../validators/sitePage.validator";

export async function listPages(villaId: number) {
  return prisma.sitePage.findMany({
    where: { villaId },
    orderBy: { slug: "asc" },
    select: {
      id: true,
      slug: true,
      titleEn: true,
      titleEl: true,
      lastModified: true,
      createdAt: true,
    },
  });
}

export async function getPageBySlug(slug: string) {
  return prisma.sitePage.findUnique({ where: { slug } });
}

export async function getPageById(id: number, villaId: number) {
  const page = await prisma.sitePage.findUnique({ where: { id } });
  if (!page || page.villaId !== villaId) return null;
  return page;
}

export async function createPage(
  villaId: number,
  input: CreateSitePageInput
) {
  try {
    return await prisma.sitePage.create({
      data: {
        villaId,
        slug: input.slug,
        titleEn: input.titleEn,
        titleEl: input.titleEl ?? null,
        contentEn: input.contentEn,
        contentEl: input.contentEl ?? null,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new SitePageError(
        `A page with slug "${input.slug}" already exists`,
        "slug"
      );
    }
    throw err;
  }
}

export async function updatePage(
  id: number,
  villaId: number,
  input: UpdateSitePageInput
) {
  const existing = await prisma.sitePage.findUnique({ where: { id } });
  if (!existing || existing.villaId !== villaId) return null;

  try {
    return await prisma.sitePage.update({
      where: { id },
      data: {
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.titleEn !== undefined && { titleEn: input.titleEn }),
        ...(input.titleEl !== undefined && { titleEl: input.titleEl }),
        ...(input.contentEn !== undefined && { contentEn: input.contentEn }),
        ...(input.contentEl !== undefined && { contentEl: input.contentEl }),
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new SitePageError(
        `A page with slug "${input.slug}" already exists`,
        "slug"
      );
    }
    throw err;
  }
}

export async function deletePage(id: number, villaId: number) {
  const existing = await prisma.sitePage.findUnique({ where: { id } });
  if (!existing || existing.villaId !== villaId) return null;

  return prisma.sitePage.delete({ where: { id } });
}

export class SitePageError extends Error {
  field: string;
  constructor(message: string, field: string) {
    super(message);
    this.name = "SitePageError";
    this.field = field;
  }
}
