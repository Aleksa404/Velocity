import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import { videoUploadQueue } from "../YoutubeUploadMQ/videoQueue";


const prisma = new PrismaClient();

export const createVideo = async (req: Request, res: Response) => {
    try {
        console.log(req.user);
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No video file provided" });
        }

        const { title, description, workshopId } = req.body;
        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }

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
        await videoUploadQueue.add("video-upload", {
            type: 'upload',
            title,
            description,
            workshopId,
            userId,
            filePath: req.file.path,
        });

        return res.status(202).json({
            success: true,
            message: "Video upload started in background",
        });
    } catch (error: any) {
        console.error("Error creating video:", error);
        // Clean up temp file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
            details: error.response?.data || "No additional details",
        });
    }
};

export const getVideos = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const workshopId = req.query.workshopId as string;

        if (!workshopId) {
            return res.status(400).json({ message: "Workshop ID is required to fetch videos" });
        }

        // Check if user has access to this workshop
        const workshop = await prisma.workshop.findUnique({
            where: { id: workshopId },
            include: {
                enrollments: {
                    where: { userId: userId },
                },
            },
        });

        if (!workshop) {
            return res.status(404).json({ message: "Workshop not found" });
        }

        const isTrainer = workshop.trainerId === userId;
        const isEnrolled = workshop.enrollments.some(e => e.status === "APPROVED");

        if (!isTrainer && !isEnrolled) {
            return res.status(403).json({ message: "You must be enrolled and approved in this workshop to view videos." });
        }

        const videos = await prisma.video.findMany({
            where: { workshopId },
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
    } catch (error) {
        console.error("Error fetching videos:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const deleteVideo = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const videoId = req.params.id;

        const video = await prisma.video.findUnique({
            where: { id: videoId },
        });

        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        if (video.trainerId !== userId) {
            return res.status(403).json({ message: "You can only delete your own videos" });
        }

        // Delete from DB

        await prisma.video.delete({
            where: { id: videoId },
        });

        // https://www.youtube.com/watch?v=VIDEO_ID
        const youtubeId = video.url.split("v=")[1];

        if (youtubeId) {
            await videoUploadQueue.add("video-delete", {
                type: 'delete',
                youtubeId: youtubeId,
                userId: userId!,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Video deleted successfully",
        });

    } catch (error) {
        console.error("Error deleting video:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
