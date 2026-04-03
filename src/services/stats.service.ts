import { Prisma } from "@prisma/client";
import prisma from "../config/database";

export async function getBookingStats() {
  const now = new Date();
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000);
  const daysInThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();

  const villa = await prisma.villa.findFirst({ select: { id: true } });

  const [pending, confirmed, completed, cancelled] = await Promise.all([
    prisma.booking.count({ where: { status: "pending" } }),
    prisma.booking.count({ where: { status: "confirmed" } }),
    prisma.booking.count({ where: { status: "completed" } }),
    prisma.booking.count({ where: { status: "cancelled" } }),
  ]);

  const [
    revenueAll,
    revenueThisMonth,
    revenueLastMonth,
    bookedNightsThisMonth,
    avgStats,
    upcomingCheckIns,
  ] = await Promise.all([
    prisma.booking.aggregate({
      where: { status: { in: ["confirmed", "completed"] } },
      _sum: { totalPrice: true },
    }),
    prisma.booking.aggregate({
      where: {
        status: { in: ["confirmed", "completed"] },
        createdAt: { gte: thisMonthStart, lt: nextMonthStart },
      },
      _sum: { totalPrice: true },
    }),
    prisma.booking.aggregate({
      where: {
        status: { in: ["confirmed", "completed"] },
        createdAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
      _sum: { totalPrice: true },
    }),
    // Count actual blocked nights this month — accurate regardless of booking span
    villa
      ? prisma.blockedDate.count({
          where: {
            villaId: villa.id,
            date: { gte: thisMonthStart, lt: nextMonthStart },
          },
        })
      : Promise.resolve(0),
    prisma.booking.aggregate({
      where: { status: { in: ["confirmed", "completed"] } },
      _avg: { totalPrice: true, numNights: true },
    }),
    prisma.booking.count({
      where: {
        status: { in: ["confirmed", "pending"] },
        checkIn: { gte: now, lte: thirtyDaysFromNow },
      },
    }),
  ]);

  return {
    bookings: {
      pending,
      confirmed,
      completed,
      cancelled,
      total: pending + confirmed + completed + cancelled,
    },
    revenue: {
      total: (revenueAll._sum.totalPrice ?? new Prisma.Decimal(0)).toFixed(2),
      thisMonth: (revenueThisMonth._sum.totalPrice ?? new Prisma.Decimal(0)).toFixed(2),
      lastMonth: (revenueLastMonth._sum.totalPrice ?? new Prisma.Decimal(0)).toFixed(2),
    },
    occupancy: {
      bookedNightsThisMonth,
      daysInThisMonth,
      rate: daysInThisMonth > 0
        ? Math.round((bookedNightsThisMonth / daysInThisMonth) * 1000) / 10
        : 0,
    },
    averages: {
      bookingValue: (avgStats._avg.totalPrice ?? new Prisma.Decimal(0)).toFixed(2),
      lengthOfStay: Math.round((avgStats._avg.numNights ?? 0) * 10) / 10,
    },
    upcomingCheckIns,
  };
}
