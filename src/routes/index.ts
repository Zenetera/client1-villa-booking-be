import { Router } from "express";
import publicRoutes from "./public.routes";
import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/", publicRoutes);
router.use("/admin", adminRoutes);

export default router;
