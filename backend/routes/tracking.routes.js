import { Router } from "express";
import rateLimit from "express-rate-limit";
import { trackRequest } from "../controllers/tracking.controller.js";

const router = Router();
const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many tracking attempts. Please wait 15 minutes and try again." }
});

router.post("/", trackingLimiter, trackRequest);
export default router;
