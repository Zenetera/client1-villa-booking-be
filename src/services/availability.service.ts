import prisma from "../config/database";

export async function checkAvailability(
  villaId: number,
  checkIn: Date,
  checkOut: Date
): Promise<{ available: boolean; conflictingDates: string[] }> {
  // Check-out date is NOT a blocked night, so check checkIn to checkOut - 1 day
  const lastNight = new Date(checkOut.getTime());
  lastNight.setUTCDate(lastNight.getUTCDate() - 1);

  const blocked = await prisma.blockedDate.findMany({
    where: {
      villaId,
      date: { gte: checkIn, lte: lastNight },
    },
    select: { date: true },
    orderBy: { date: "asc" },
  });

  const conflictingDates = blocked.map(
    (b) => b.date.toISOString().split("T")[0]
  );

  return { available: blocked.length === 0, conflictingDates };
}

export interface CalendarDay {
  date: string;
  available: boolean;
  price: string | null;
  reason: string | null;
}

export async function getCalendar(
  villaId: number,
  from: Date,
  to: Date
): Promise<CalendarDay[]> {
  const villa = await prisma.villa.findUniqueOrThrow({
    where: { id: villaId },
    select: { basePricePerNight: true, minNights: true },
  });

  const [blockedDates, pricingRules] = await Promise.all([
    prisma.blockedDate.findMany({
      where: { villaId, date: { gte: from, lte: to } },
      select: { date: true, reason: true },
    }),
    prisma.pricingRule.findMany({
      where: {
        villaId,
        startDate: { lte: to },
        endDate: { gte: from },
      },
      orderBy: { priority: "desc" },
    }),
  ]);

  const blockedMap = new Map(
    blockedDates.map((b) => [b.date.toISOString().split("T")[0], b.reason])
  );

  const days: CalendarDay[] = [];
  const current = new Date(from.getTime());

  while (current <= to) {
    const dateStr = current.toISOString().split("T")[0];
    const blocked = blockedMap.has(dateStr);

    const matchingRule = pricingRules.find((rule) => {
      if (current < rule.startDate || current > rule.endDate) return false;
      if (rule.minNights !== null && villa.minNights < rule.minNights)
        return false;
      return true;
    });

    const price = matchingRule
      ? matchingRule.pricePerNight
      : villa.basePricePerNight;

    days.push({
      date: dateStr,
      available: !blocked,
      price: price.toFixed(2),
      reason: blocked ? blockedMap.get(dateStr)! : null,
    });

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return days;
}
