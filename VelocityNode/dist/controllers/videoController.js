"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideos = exports.createVideo = void 0;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
// Configure multer for temporary file storage
// Configure multer for temporary file storage
const videoQueue_1 = require("../YoutubeUploadMQ/videoQueue");
const createVideo = async (req, res) => {
    try {
        console.log(req.user);
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No video file provided" });
        }
        const { title, workshopId } = req.body;
        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }
        // workshopId is now required - videos must belong to a workshop
        if (!workshopId) {
            return res.status(400).json({ message: "Workshop ID is required. Videos must belong to a workshop." });
        }
        // Verify workshop exists and belongs to this trainer
        const workshop = await prisma.workshop.findUnique({
            where: { id: workshopId },
        });
        if (!workshop) {
            return res.status(404).json({ message: "Workshop not found" });
        }
        if (workshop.trainerId !== userId) {
            return res.status(403).json({ message: "You can only add videos to your own workshops" });
        }
        // Add job to background queue
        await videoQueue_1.videoUploadQueue.add("video-upload", {
            type: 'upload',
            title,
            workshopId,
            userId,
            filePath: req.file.path,
        });
        return res.status(202).json({
            success: true,
            message: "Video upload started in background",
        });
    }
    catch (error) {
        console.error("Error creating video:", error);
        // Clean up temp file if it exists
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
            details: error.response?.data || "No additional details",
        });
    }
};
exports.createVideo = createVideo;
const getVideos = async (req, res) => {
    try {
        const userId = req.user?.id;
        const videos = await prisma.video.findMany({
            include: {
                trainer: {
                    select: {
                        first_name: true,
                        last_name: true,
                    },
                },
                watchProgress: userId ? {
                    where: { userId },
                    select: {
                        watchedSeconds: true,
                        totalDuration: true,
                        percentWatched: true,
                        isCompleted: true,
                        lastWatchedAt: true,
                    }
                } : false,
            },
            orderBy: {
                uploadedAt: "desc",
            },
        });
        return res.status(200).json({
            success: true,
            data: videos,
        });
    }
    catch (error) {
        console.error("Error fetching videos:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.getVideos = getVideos;
//# sourceMappingURL=videoController.js.map