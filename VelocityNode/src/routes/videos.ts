import express from "express";
import { createVideo, getVideos, deleteVideo } from "../controllers/videoController";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";
import {
    updateVideoProgress,
    getVideoProgress,
    getContinueWatching,
    markVideoComplete,

} from "../controllers/videoProgressController";
import multer from "multer";

const router = express.Router();
router.use(authenticateToken)

const upload = multer({ dest: "uploads/" });
const multerUploadMiddleware = upload.single("video");

router.get("/", getVideos);

// Protected route for trainers to post videos
router.post("/", requireRole("TRAINER"), multerUploadMiddleware, createVideo);
router.delete("/:id", requireRole("TRAINER"), deleteVideo);

// Video progress tracking routes
router.post("/:id/progress", updateVideoProgress);
router.get("/:id/progress", getVideoProgress);
router.post("/:id/complete", markVideoComplete);
router.get("/my/continue-watching", getContinueWatching);


export default router;
