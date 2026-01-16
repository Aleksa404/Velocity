import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { videoUploadQueue, StorageType } from "../YoutubeUploadMQ/videoQueue";

const prisma = new PrismaClient();
const VIDEOS_DIR = path.join(__dirname, "../../videos");

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

        const { title, description, workshopId, storageType, sectionId } = req.body;
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

        // Validate storage type (defaults to LOCAL)
        const selectedStorageType: StorageType = storageType === "YOUTUBE" ? "YOUTUBE" : "LOCAL";

        // Add job to background queue for compression and storage
        await videoUploadQueue.add("video-upload", {
            type: "upload",
            title,
            description,
            workshopId,
            sectionId,
            userId,
            filePath: req.file.path,
            storageType: selectedStorageType,
        });

        const destination = selectedStorageType === "YOUTUBE" ? "YouTube" : "local storage";
        return res.status(202).json({
            success: true,
            message: `Video upload to ${destination} started. It will be available shortly.`,
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

        // Queue background job to delete the file from storage
        await videoUploadQueue.add("video-delete", {
            type: "delete",
            videoUrl: video.url,
            storageType: video.storageType as StorageType,
            userId: userId!,
        });

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

/**
 * Stream local video file with range request support for seeking
 */
export const streamVideo = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(VIDEOS_DIR, filename);

        // Security: prevent directory traversal
        if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
            return res.status(400).json({ message: "Invalid filename" });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Video not found" });
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            // Handle range request for seeking
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;

            const file = fs.createReadStream(filePath, { start, end });

            res.writeHead(206, {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunkSize,
                "Content-Type": "video/mp4",
            });

            file.pipe(res);
        } else {
            // No range, send entire file
            res.writeHead(200, {
                "Content-Length": fileSize,
                "Content-Type": "video/mp4",
            });

            fs.createReadStream(filePath).pipe(res);
        }
    } catch (error) {
        console.error("Error streaming video:", error);
        return res.status(500).json({ message: "Error streaming video" });
    }
};
export const updateVideoSection = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const videoId = req.params.id;
        const { sectionId } = req.body;

        const video = await prisma.video.findUnique({
            where: { id: videoId },
        });

        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        if (video.trainerId !== userId) {
            return res.status(403).json({ message: "You can only edit your own videos" });
        }

        // Check if section belongs to the same workshop if provided
        if (sectionId) {
            const section = await prisma.workshopSection.findUnique({
                where: { id: sectionId }
            });

            if (!section || section.workshopId !== video.workshopId) {
                return res.status(400).json({ message: "Invalid section" });
            }
        }

        const updatedVideo = await prisma.video.update({
            where: { id: videoId },
            data: { sectionId: sectionId || null }
        });

        return res.status(200).json({
            success: true,
            data: updatedVideo
        });
    } catch (error) {
        console.error("Error updating video section:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
