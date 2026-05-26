import express from "express";
import { createVideo, getVideos, deleteVideo, streamVideo, updateVideoSection } from "../controllers/videoController";
import { uploadPdf, deletePdf } from "../controllers/videoPdfController";
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

// Public route - Video streaming
// This allows the HTML5 video element to stream without auth headers
router.get("/stream/:filename", streamVideo);

// Apply authentication to all routes below
router.use(authenticateToken);

router.get("/", getVideos);

// Protected route for trainers to post videos
router.post("/", requireRole("TRAINER"), multerUploadMiddleware, createVideo);
router.patch("/:id/section", requireRole("TRAINER"), updateVideoSection);
router.delete("/:id", requireRole("TRAINER"), deleteVideo);

// Multer setup for PDFs
const pdfMulterUpload = multer({
    dest: "uploads/",
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"));
        }
    }
}).single("pdf");

// PDF endpoints
router.post("/:id/pdf", requireRole("TRAINER"), pdfMulterUpload, uploadPdf);
router.delete("/:id/pdf", requireRole("TRAINER"), deletePdf);


// Video progress tracking routes
router.post("/:id/progress", updateVideoProgress);
router.get("/:id/progress", getVideoProgress);
router.post("/:id/complete", markVideoComplete);
router.get("/my/continue-watching", getContinueWatching);


export default router;
