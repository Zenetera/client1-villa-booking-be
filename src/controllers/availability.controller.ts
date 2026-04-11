import { Request, Response } from "express";
import { getCalendar } from "../services/availability.service";
import { calculatePricing } from "../services/pricing.service";
import { calendarQuerySchema } from "../validators/booking.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";
import prisma from "../config/database";

export async function getAvailabilityCalendar(req: Request, res: Response) {
  const query = calendarQuerySchema.parse(req.query);
  const from = new Date(query.from);
  const to = new Date(query.to);

  if (isNaN(from.getTime())) {
    res.status(400).json(errorResponse("Invalid date value", "from"));
    return;
  }
  if (isNaN(to.getTime())) {
    res.status(400).json(errorResponse("Invalid date value", "to"));
    return;
  }

  const villa = await prisma.villa.findFirst({
    select: { id: true, minNights: true, maxNights: true },
  });
  if (!villa) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const days = await getCalendar(villa.id, from, to);

  res.json(
    successResponse({
      villaId: villa.id,
      minNights: villa.minNights,
      maxNights: villa.maxNights,
      dates: days,
    })
  );
}

export async function getPricingQuote(req: Request, res: Response) {
  const { from, to } = calendarQuerySchema.parse(req.query);
  const checkInDate = new Date(from);
  const checkOutDate = new Date(to);

  if (isNaN(checkInDate.getTime())) {
    res.status(400).json(errorResponse("Invalid date value", "from"));
    return;
  }
  if (isNaN(checkOutDate.getTime())) {
    res.status(400).json(errorResponse("Invalid date value", "to"));
    return;
  }

  if (checkOutDate <= checkInDate) {
    res.status(400).json(errorResponse("Check-out must be after check-in", "checkOut"));
    return;
  }

  const villa = await prisma.villa.findFirst({
    select: { id: true },
  });
  if (!villa) {
    res.status(404).json(errorResponse("Villa not found"));
    return;
  }

  const pricing = await calculatePricing(villa.id, checkInDate, checkOutDate);

  res.json(
    successResponse({
      numNights: pricing.numNights,
      nights: pricing.nights.map((n) => ({
        date: n.date,
        price: n.price.toFixed(2),
        ruleName: n.ruleName,
      })),
      accommodationTotal: pricing.accommodationTotal.toFixed(2),
      nightlyRate: pricing.nightlyRate.toFixed(2),
      touristTaxPerNight: pricing.touristTaxPerNight.toFixed(2),
      touristTaxTotal: pricing.touristTaxTotal.toFixed(2),
      totalPrice: pricing.totalPrice.toFixed(2),
      depositPercentage: pricing.depositPercentage.toFixed(2),
      depositAmount: pricing.depositAmount.toFixed(2),
    })
  );
}
