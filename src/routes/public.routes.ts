import { Router } from "express";
import * as villaController from "../controllers/villa.controller";
import * as availabilityController from "../controllers/availability.controller";
import * as bookingController from "../controllers/booking.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Villa
router.get("/villa", asyncHandler(villaController.getVilla));

// Availability & pricing
router.get("/availability", asyncHandler(availabilityController.getAvailabilityCalendar));
router.get("/pricing", asyncHandler(availabilityController.getPricingQuote));

// Bookings (public)
router.post("/bookings", asyncHandler(bookingController.createBooking));
router.get("/bookings/:referenceCode", asyncHandler(bookingController.getBookingByReference));

export default router;
