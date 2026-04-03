import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as villaController from "../controllers/villa.controller";
import * as bookingController from "../controllers/booking.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);

// Villa
router.put("/villa", asyncHandler(villaController.updateVilla));

// Stats
router.get("/stats", asyncHandler(bookingController.getStats));

// Bookings (admin)
router.get("/bookings", asyncHandler(bookingController.listBookings));
router.get("/bookings/export", asyncHandler(bookingController.exportBookings));
router.get("/bookings/:id", asyncHandler(bookingController.getBooking));
router.patch("/bookings/:id/confirm", asyncHandler(bookingController.confirmBooking));
router.patch("/bookings/:id/cancel", asyncHandler(bookingController.cancelBooking));
router.patch("/bookings/:id/complete", asyncHandler(bookingController.completeBooking));

export default router;
