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

const router = Router();


router.post("/scan", validateStationStage, scanHandler);
router.post("/push-reading", identifyStation, pushReadingHandler); // baru — dipanggil EDGE
router.get("/live-reading", identifyStation, liveReadingHandler);
router.post("/:id/submit", validateStationStage, submitHandler);
router.post("/:id/approve", approveHandler);
router.post("/:id/reject", rejectHandler);
router.get("/:id/history", attemptHistoryHandler);

export default router;