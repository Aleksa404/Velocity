import { Router } from "express";
import {
    createTrainerRequest,
    getAllTrainerRequests,
    getPendingTrainerRequests,
    approveTrainerRequest,
    denyTrainerRequest,
    getUserTrainerRequest,
} from "../controllers/trainerRequestController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

// User routes
router.post("/", requireRole("USER"), createTrainerRequest);
router.get("/my-request", requireRole("USER"), getUserTrainerRequest);

// Admin routes 
router.use(requireRole("ADMIN"));
router.get("/", getAllTrainerRequests);
router.get("/pending", getPendingTrainerRequests);
router.patch("/:id/approve", approveTrainerRequest);
router.patch("/:id/deny", denyTrainerRequest);

export default router;
