import express from "express";
import { createVideo, getVideos, uploadMiddleware } from "../controllers/videoController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";

const router = express.Router();

// Public route to view videos (or protected if you prefer)
router.get("/", getVideos);

// Protected route for trainers to post videos
router.post("/", authenticateToken, requireRole("TRAINER"), uploadMiddleware, createVideo);

export default router;
