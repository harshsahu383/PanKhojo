import { Router } from "express";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import {
    listRequests,
    getRequestDetails,
    changeRequestStatus,
    revealRequestAadhaar
} from "../controllers/request.controller.js";

const router = Router();

// Public request creation is disabled. Payment verification creates requests.
router.get("/", authenticateAdmin, listRequests);
router.get("/:id", authenticateAdmin, getRequestDetails);
router.post("/:id/reveal-aadhaar", authenticateAdmin, revealRequestAadhaar);
router.patch("/:id/status", authenticateAdmin, changeRequestStatus);

export default router;
