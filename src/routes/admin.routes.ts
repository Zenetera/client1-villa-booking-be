import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as villaController from "../controllers/villa.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.put("/villa", asyncHandler(villaController.updateVilla));

export default router;
