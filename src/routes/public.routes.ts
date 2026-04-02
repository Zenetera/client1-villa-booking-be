import { Router } from "express";
import * as villaController from "../controllers/villa.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/villa", asyncHandler(villaController.getVilla));

export default router;
