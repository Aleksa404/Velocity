import express from "express";
import { createVideo, getVideos, uploadMiddleware } from "../controllers/videoController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";
import {
    updateVideoProgress,
    getVideoProgress,
    getContinueWatching,
    markVideoComplete,
    getWatchHistory,
} from "../controllers/videoProgressController";

const router = express.Router();

router.use(authenticateToken)

// Public route to view videos (with optional auth for progress)
router.get("/", getVideos);

// Protected route for trainers to post videos
router.post("/", requireRole("TRAINER"), uploadMiddleware, createVideo);

// Video progress tracking routes (protected)
router.post("/:id/progress", updateVideoProgress);
router.get("/:id/progress", getVideoProgress);
router.post("/:id/complete", markVideoComplete);
router.get("/my/continue-watching", getContinueWatching);
router.get("/my/watch-history", getWatchHistory);

export default router;
