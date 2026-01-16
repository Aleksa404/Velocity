import express from "express";
import { createVideo, getVideos, deleteVideo, streamVideo, updateVideoSection } from "../controllers/videoController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";
import {
    updateVideoProgress,
    getVideoProgress,
    getContinueWatching,
    markVideoComplete,

} from "../controllers/videoProgressController";
import multer from "multer";

const router = express.Router();

const upload = multer({ dest: "uploads/" });
const multerUploadMiddleware = upload.single("video");

// Public route - Video streaming (must be BEFORE authenticateToken middleware)
// This allows the HTML5 video element to stream without auth headers
router.get("/stream/:filename", streamVideo);

// Apply authentication to all routes below
router.use(authenticateToken);

router.get("/", getVideos);

// Protected route for trainers to post videos
router.post("/", requireRole("TRAINER"), multerUploadMiddleware, createVideo);
router.delete("/:id", requireRole("TRAINER"), deleteVideo);
router.patch("/:id/section", requireRole("TRAINER"), updateVideoSection);


// Video progress tracking routes
router.post("/:id/progress", updateVideoProgress);
router.get("/:id/progress", getVideoProgress);
router.post("/:id/complete", markVideoComplete);
router.get("/my/continue-watching", getContinueWatching);


export default router;
