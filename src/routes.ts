import { Router } from "express";
import authRoutes from "./routes/auth.routes";
import roomRoutes from "./routes/room.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/rooms", roomRoutes);

export default router;
