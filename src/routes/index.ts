import { Router } from "express";
import weighingRouter from "./weighingRoutes";
import authRouter from "./authRoutes";
import publicRouter from "./publicRoutes";

const router = Router();

router.use("/weighing", weighingRouter);
router.use("/auth", authRouter);
router.use("/public", publicRouter);

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default router;
