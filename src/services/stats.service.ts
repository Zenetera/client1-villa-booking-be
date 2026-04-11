import { Prisma } from "@prisma/client";
import prisma from "../config/database";

export async function getBookingStats() {
  const now = new Date();
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  
  // Start of current week (assuming Monday start)
  const currentDay = now.getUTCDay();
  const diffToMonday = now.getUTCDate() - currentDay + (currentDay === 0 ? -6 : 1);
  const thisWeekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diffToMonday));

  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000);
  const daysInThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const daysInLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).getUTCDate();

  const villa = await prisma.villa.findFirst({ select: { id: true } });

  const [
    pending,
    confirmed,
    completed,
    cancelled,
    bookingsThisWeek,
  ] = await Promise.all([
    prisma.booking.count({ where: { status: "pending" } }),
    prisma.booking.count({ where: { status: "confirmed" } }),
    prisma.booking.count({ where: { status: "completed" } }),
    prisma.booking.count({ where: { status: "cancelled" } }),
    prisma.booking.count({ where: { createdAt: { gte: thisWeekStart } } }),
  ]);

  const [
    revenueAll,
    revenueThisMonth,
    revenueLastMonth,
    bookedNightsThisMonth,
    bookedNightsLastMonth,
    avgStats,
    upcomingCheckIns,
    nextCheckInRec,
    nextCheckOutRec,
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
    villa ? prisma.blockedDate.count({
      where: { villaId: villa.id, date: { gte: thisMonthStart, lt: nextMonthStart } }
    }) : Promise.resolve(0),
    villa ? prisma.blockedDate.count({
      where: { villaId: villa.id, date: { gte: lastMonthStart, lt: thisMonthStart } }
    }) : Promise.resolve(0),
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
    prisma.booking.findFirst({
      where: { status: "confirmed", checkIn: { gte: now } },
      orderBy: { checkIn: "asc" },
      select: { guestName: true, checkIn: true, checkOut: true }
    }),
    prisma.booking.findFirst({
      where: { status: "confirmed", checkOut: { gte: now } },
      orderBy: { checkOut: "asc" },
      select: { id: true, guestName: true, checkIn: true, checkOut: true }
    })
  ]);

  let gapNightsToNext: number | null = null;
  if (nextCheckOutRec) {
    const subsequentCheckIn = await prisma.booking.findFirst({
      where: { 
        status: "confirmed", 
        checkIn: { gte: nextCheckOutRec.checkOut },
        id: { not: nextCheckOutRec.id }
      },
      orderBy: { checkIn: "asc" },
      select: { checkIn: true }
    });
    
    if (subsequentCheckIn) {
      gapNightsToNext = Math.round(
        (subsequentCheckIn.checkIn.getTime() - nextCheckOutRec.checkOut.getTime()) / 86400000
      );
    }
  }

  const thisMonthRevenueNum = Number(revenueThisMonth._sum.totalPrice ?? 0);
  const lastMonthRevenueNum = Number(revenueLastMonth._sum.totalPrice ?? 0);
  const revenuePercentageChange = lastMonthRevenueNum !== 0 
    ? ((thisMonthRevenueNum - lastMonthRevenueNum) / lastMonthRevenueNum) * 100 
    : 0;

  const thisMonthOccRate = daysInThisMonth > 0 ? (bookedNightsThisMonth / daysInThisMonth) * 100 : 0;
  const lastMonthOccRate = daysInLastMonth > 0 ? (bookedNightsLastMonth / daysInLastMonth) * 100 : 0;
  const occPercentageChange = lastMonthOccRate !== 0 
    ? ((thisMonthOccRate - lastMonthOccRate) / lastMonthOccRate) * 100 
    : 0;

  return {
    bookings: {
      pending,
      confirmed,
      completed,
      cancelled,
      total: pending + confirmed + completed + cancelled,
      thisWeek: bookingsThisWeek
    },
    revenue: {
      total: (revenueAll._sum.totalPrice ?? new Prisma.Decimal(0)).toFixed(2),
      thisMonth: thisMonthRevenueNum.toFixed(2),
      lastMonth: lastMonthRevenueNum.toFixed(2),
      percentageChange: Math.round(revenuePercentageChange * 10) / 10
    },
    occupancy: {
      bookedNightsThisMonth,
      daysInThisMonth,
      rate: Math.round(thisMonthOccRate * 10) / 10,
      percentageChange: Math.round(occPercentageChange * 10) / 10
    },
    averages: {
      bookingValue: (avgStats._avg.totalPrice ?? new Prisma.Decimal(0)).toFixed(2),
      lengthOfStay: Math.round((avgStats._avg.numNights ?? 0) * 10) / 10,
    },
    upcomingCheckIns,
    nextCheckIn: nextCheckInRec ? {
      guestName: nextCheckInRec.guestName,
      checkIn: nextCheckInRec.checkIn.toISOString().split("T")[0],
      checkOut: nextCheckInRec.checkOut.toISOString().split("T")[0],
      daysUntil: Math.ceil((nextCheckInRec.checkIn.getTime() - now.getTime()) / 86400000)
    } : null,
    nextCheckOut: nextCheckOutRec ? {
      guestName: nextCheckOutRec.guestName,
      checkIn: nextCheckOutRec.checkIn.toISOString().split("T")[0],
      checkOut: nextCheckOutRec.checkOut.toISOString().split("T")[0],
      daysUntil: Math.ceil((nextCheckOutRec.checkOut.getTime() - now.getTime()) / 86400000),
      gapNightsToNext
    } : null
  };
}
