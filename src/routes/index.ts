import { Router } from "express";
import weighingRouter from "./weighingRoutes";
import authRouter from "./authRoutes";

const router = Router();

router.use("/weighing", weighingRouter);
router.use("/auth", authRouter);

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default router;
