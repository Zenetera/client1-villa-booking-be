import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as villaController from "../controllers/villa.controller";
import * as bookingController from "../controllers/booking.controller";
import * as blockedDateController from "../controllers/blockedDate.controller";
import * as pricingRuleController from "../controllers/pricingRule.controller";
import * as villaImageController from "../controllers/villaImage.controller";
import * as sitePageController from "../controllers/sitePage.controller";
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
router.get("/bookings/reference/:referenceCode", asyncHandler(bookingController.getBookingByReference));
router.patch("/bookings/:id/confirm", asyncHandler(bookingController.confirmBooking));
router.patch("/bookings/:id/cancel", asyncHandler(bookingController.cancelBooking));
router.patch("/bookings/:id/complete", asyncHandler(bookingController.completeBooking));

// Blocked dates
router.get("/blocked-dates", asyncHandler(blockedDateController.listBlockedDates));
router.post("/blocked-dates", asyncHandler(blockedDateController.createBlockedDates));
router.delete("/blocked-dates/range", asyncHandler(blockedDateController.deleteBlockedDateRange));
router.delete("/blocked-dates/:id", asyncHandler(blockedDateController.deleteBlockedDate));

// Pricing rules
router.get("/pricing-rules", asyncHandler(pricingRuleController.listPricingRules));
router.post("/pricing-rules", asyncHandler(pricingRuleController.createPricingRule));
router.put("/pricing-rules/:id", asyncHandler(pricingRuleController.updatePricingRule));
router.delete("/pricing-rules/:id", asyncHandler(pricingRuleController.deletePricingRule));

// Villa images
router.get("/images", asyncHandler(villaImageController.listImages));
router.post("/images", asyncHandler(villaImageController.createImage));
router.put("/images/reorder", asyncHandler(villaImageController.reorderImages));
router.put("/images/:id", asyncHandler(villaImageController.updateImage));
router.delete("/images/:id", asyncHandler(villaImageController.deleteImage));

// Site pages (legal pages, etc.)
router.get("/pages", asyncHandler(sitePageController.listPages));
router.post("/pages", asyncHandler(sitePageController.createPage));
router.get("/pages/:id", asyncHandler(sitePageController.getPage));
router.put("/pages/:id", asyncHandler(sitePageController.updatePage));
router.delete("/pages/:id", asyncHandler(sitePageController.deletePage));

export default router;
