import { Prisma } from "@prisma/client";
import prisma from "../config/database";
import type { CreateBlockedDateInput } from "../validators/blockedDate.validator";

export async function listBlockedDates(
  villaId: number,
  opts: { from?: string; to?: string }
) {
  const where: Prisma.BlockedDateWhereInput = {
    villaId,
    bookingId: null, // Only manual blocks, not booking-generated ones
    ...(opts.from || opts.to
      ? {
          date: {
            ...(opts.from ? { gte: new Date(opts.from) } : {}),
            ...(opts.to ? { lte: new Date(opts.to) } : {}),
          },
        }
      : {}),
  };

  return prisma.blockedDate.findMany({
    where,
    orderBy: { date: "asc" },
  });
}

export async function createBlockedDates(
  villaId: number,
  input: CreateBlockedDateInput
) {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  const numDays =
    Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

  const dates: { villaId: number; date: Date; reason: string }[] = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(startDate.getTime());
    d.setUTCDate(d.getUTCDate() + i);
    dates.push({ villaId, date: d, reason: input.reason });
  }

  try {
    const result = await prisma.blockedDate.createMany({
      data: dates,
      skipDuplicates: true,
    });
    return { created: result.count, total: numDays };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new BlockedDateError(
        "Some dates in the range are already blocked",
        "startDate"
      );
    }
    throw err;
  }
}

export async function deleteBlockedDate(id: number, villaId: number) {
  const blocked = await prisma.blockedDate.findUnique({ where: { id } });

  if (!blocked || blocked.villaId !== villaId) {
    return null;
  }

  if (blocked.bookingId !== null) {
    throw new BlockedDateError(
      "Cannot delete a date blocked by a booking. Cancel the booking instead.",
      "id"
    );
  }

  return prisma.blockedDate.delete({ where: { id } });
}

export async function deleteBlockedDateRange(
  villaId: number,
  from: string,
  to: string
) {
  const result = await prisma.blockedDate.deleteMany({
    where: {
      villaId,
      bookingId: null,
      date: { gte: new Date(from), lte: new Date(to) },
    },
  });

  return { deleted: result.count };
}

export class BlockedDateError extends Error {
  field: string;
  constructor(message: string, field: string) {
    super(message);
    this.name = "BlockedDateError";
    this.field = field;
  }
}
