"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWatchHistory = exports.markVideoComplete = exports.getContinueWatching = exports.getVideoProgress = exports.updateVideoProgress = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Update video watch progress
const updateVideoProgress = async (req, res) => {
    try {
        const { id: videoId } = req.params;
        const { id: userId } = req.user;
        const { watchedSeconds, totalDuration } = req.body;
        if (typeof watchedSeconds !== "number" || watchedSeconds < 0) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Invalid watchedSeconds",
            });
        }
        // Calculate percentage
        const percentWatched = totalDuration
            ? Math.min(Math.floor((watchedSeconds / totalDuration) * 100), 100)
            : 0;
        // Mark as completed if >95% watched
        const isCompleted = percentWatched >= 95;
        // Upsert (create or update)
        const progress = await prisma.videoWatchProgress.upsert({
            where: {
                userId_videoId: {
                    userId,
                    videoId,
                },
            },
            create: {
                userId,
                videoId,
                watchedSeconds,
                totalDuration,
                percentWatched,
                isCompleted,
                lastWatchedAt: new Date(),
            },
            update: {
                watchedSeconds,
                totalDuration,
                percentWatched,
                isCompleted,
                lastWatchedAt: new Date(),
            },
        });
        res.status(200).json({
            success: true,
            data: progress,
            message: "Progress updated successfully",
        });
    }
    catch (error) {
        console.error("Error updating video progress:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to update progress",
        });
    }
};
exports.updateVideoProgress = updateVideoProgress;
// Get progress for a specific video
const getVideoProgress = async (req, res) => {
    try {
        const { id: videoId } = req.params;
        const { id: userId } = req.user;
        const progress = await prisma.videoWatchProgress.findUnique({
            where: {
                userId_videoId: {
                    userId,
                    videoId,
                },
            },
        });
        res.status(200).json({
            success: true,
            data: progress,
            message: "Progress fetched successfully",
        });
    }
    catch (error) {
        console.error("Error fetching video progress:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch progress",
        });
    }
};
exports.getVideoProgress = getVideoProgress;
// Get continue watching (videos in progress, not completed)
const getContinueWatching = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const limit = parseInt(req.query.limit) || 10;
        const continueWatching = await prisma.videoWatchProgress.findMany({
            where: {
                userId,
                isCompleted: false,
                percentWatched: {
                    gte: 5, // At least 5% watched
                },
            },
            include: {
                video: {
                    include: {
                        trainer: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                            },
                        },
                        workshop: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                lastWatchedAt: "desc",
            },
            take: limit,
        });
        res.status(200).json({
            success: true,
            data: continueWatching,
            message: "Continue watching fetched successfully",
        });
    }
    catch (error) {
        console.error("Error fetching continue watching:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch continue watching",
        });
    }
};
exports.getContinueWatching = getContinueWatching;
// Mark video as completed
const markVideoComplete = async (req, res) => {
    try {
        const { id: videoId } = req.params;
        const { id: userId } = req.user;
        const progress = await prisma.videoWatchProgress.upsert({
            where: {
                userId_videoId: {
                    userId,
                    videoId,
                },
            },
            create: {
                userId,
                videoId,
                watchedSeconds: 0,
                percentWatched: 100,
                isCompleted: true,
                lastWatchedAt: new Date(),
            },
            update: {
                percentWatched: 100,
                isCompleted: true,
                lastWatchedAt: new Date(),
            },
        });
        res.status(200).json({
            success: true,
            data: progress,
            message: "Video marked as complete",
        });
    }
    catch (error) {
        console.error("Error marking video complete:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to mark video complete",
        });
    }
};
exports.markVideoComplete = markVideoComplete;
// Get watch history
const getWatchHistory = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const history = await prisma.videoWatchProgress.findMany({
            where: {
                userId,
            },
            include: {
                video: {
                    include: {
                        trainer: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                            },
                        },
                        workshop: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                lastWatchedAt: "desc",
            },
            take: limit,
            skip: offset,
        });
        res.status(200).json({
            success: true,
            data: history,
            message: "Watch history fetched successfully",
        });
    }
    catch (error) {
        console.error("Error fetching watch history:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch watch history",
        });
    }
};
exports.getWatchHistory = getWatchHistory;
//# sourceMappingURL=videoProgressController.js.map