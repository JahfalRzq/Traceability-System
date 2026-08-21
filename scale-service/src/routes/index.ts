import { Router } from "express";
import { weighingRouter } from "./weighing";

const router = Router();

router.use("/weighing", weighingRouter);

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default router;
