import { Router } from "express";
import { dashboardHandler, publicWebHandler } from "../controllers/publicController";

const router = Router();

router.get("/dashboard", dashboardHandler);
router.get("/web", publicWebHandler);

export default router;