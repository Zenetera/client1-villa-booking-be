import { Prisma } from "@prisma/client";
import prisma from "../config/database";

export interface NightPrice {
  date: string;
  price: Prisma.Decimal;
  ruleName: string | null;
}

export interface PricingBreakdown {
  nights: NightPrice[];
  accommodationTotal: Prisma.Decimal;
  nightlyRate: Prisma.Decimal;
  touristTaxPerNight: Prisma.Decimal;
  touristTaxTotal: Prisma.Decimal;
  totalPrice: Prisma.Decimal;
  depositPercentage: Prisma.Decimal;
  depositAmount: Prisma.Decimal;
  numNights: number;
}

export async function calculatePricing(
  villaId: number,
  checkIn: Date,
  checkOut: Date
): Promise<PricingBreakdown> {
  const villa = await prisma.villa.findUniqueOrThrow({
    where: { id: villaId },
    select: { basePricePerNight: true, touristTaxPerNight: true, depositPercentage: true },
  });

  const numNights = Math.round(
    (checkOut.getTime() - checkIn.getTime()) / (86400000)
  );

  const rules = await prisma.pricingRule.findMany({
    where: {
      villaId,
      startDate: { lte: checkOut },
      endDate: { gte: checkIn },
    },
    orderBy: { priority: "desc" },
  });

  const nights: NightPrice[] = [];
  let accommodationTotal = new Prisma.Decimal(0);

  for (let i = 0; i < numNights; i++) {
    const nightDate = new Date(checkIn.getTime());
    nightDate.setUTCDate(nightDate.getUTCDate() + i);

    const matchingRule = rules.find((rule) => {
      if (nightDate < rule.startDate || nightDate > rule.endDate) return false;
      return true;
    });

    const price = matchingRule
      ? matchingRule.pricePerNight
      : villa.basePricePerNight;

    nights.push({
      date: nightDate.toISOString().split("T")[0],
      price,
      ruleName: matchingRule ? matchingRule.name : null,
    });

    accommodationTotal = accommodationTotal.add(price);
  }

  const nightlyRate = accommodationTotal.div(numNights);
  const touristTaxTotal = villa.touristTaxPerNight.mul(numNights);
  const totalPrice = accommodationTotal.add(touristTaxTotal);
  const depositAmount = totalPrice.mul(villa.depositPercentage).div(100);

  return {
    nights,
    accommodationTotal,
    nightlyRate,
    touristTaxPerNight: villa.touristTaxPerNight,
    touristTaxTotal,
    totalPrice,
    depositPercentage: villa.depositPercentage,
    depositAmount,
    numNights,
  };
}

export async function getPriceForDate(
  villaId: number,
  date: Date
): Promise<{ price: Prisma.Decimal; ruleName: string | null }> {
  const villa = await prisma.villa.findUniqueOrThrow({
    where: { id: villaId },
    select: { basePricePerNight: true },
  });

  const rule = await prisma.pricingRule.findFirst({
    where: {
      villaId,
      startDate: { lte: date },
      endDate: { gte: date },
    },
    orderBy: { priority: "desc" },
  });

  return {
    price: rule ? rule.pricePerNight : villa.basePricePerNight,
    ruleName: rule ? rule.name : null,
  };
}
