import { Router } from "express";
import {
    createTrainerRequest,
    getAllTrainerRequests,
    getPendingTrainerRequests,
    approveTrainerRequest,
    denyTrainerRequest,
    getUserTrainerRequest,
} from "../controllers/trainerRequestController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// User routes
router.post("/", createTrainerRequest);
router.get("/my-request", getUserTrainerRequest);

// Admin routes (we'll add admin middleware later if needed)
router.get("/", getAllTrainerRequests);
router.get("/pending", getPendingTrainerRequests);
router.patch("/:id/approve", approveTrainerRequest);
router.patch("/:id/deny", denyTrainerRequest);

export default router;
