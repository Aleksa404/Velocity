import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiResponse } from "../types/ApiResponse";

const prisma = new PrismaClient();


export const updateVideoProgress = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                data: null,
                message: "Unauthorized",
            });
        }
        const { id: userId } = user;
        const { id: videoId } = req.params;
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
    } catch (error: any) {
        console.error("Error updating video progress:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to update progress",
        });
    }
};


export const getVideoProgress = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                data: null,
                message: "Unauthorized",
            });
        }
        const { id: videoId } = req.params;
        const { id: userId } = user;

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
    } catch (error: any) {
        console.error("Error fetching video progress:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch progress",
        });
    }
};


export const getContinueWatching = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                data: null,
                message: "Unauthorized",
            });
        }
        const { id: userId } = user;
        const limit = parseInt(req.query.limit as string) || 10;

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
    } catch (error: any) {
        console.error("Error fetching continue watching:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch continue watching",
        });
    }
};


export const markVideoComplete = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                data: null,
                message: "Unauthorized",
            });
        }
        const { id: videoId } = req.params;
        const { id: userId } = user;

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
    } catch (error: any) {
        console.error("Error marking video complete:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to mark video complete",
        });
    }
};

