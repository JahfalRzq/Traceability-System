import { Router } from "express";
import {
  scanHandler,
  pushReadingHandler,
  liveReadingHandler,
  submitHandler,
  approveHandler,
  rejectHandler,
  attemptHistoryHandler,
} from "../controllers/weighingController";
import { identifyStation, validateStationStage } from "../middlewares/stationValidation";
import { authenticate } from "@middlewares/authMiddleware";

const router = Router();

router.post("/push-reading", identifyStation, pushReadingHandler); // baru — dipanggil EDGE


router.post("/scan", authenticate, validateStationStage, scanHandler);
router.get("/live-reading", authenticate,identifyStation, liveReadingHandler);
router.post("/:id/submit", authenticate,validateStationStage, submitHandler);
router.post("/:id/approve", authenticate, approveHandler);
router.post("/:id/reject", authenticate, rejectHandler);
router.get("/:id/history", authenticate, attemptHistoryHandler);

export default router;