import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

import fs from "fs";
import multer from "multer";
import { google } from "googleapis";

// Configure multer for temporary file storage
const upload = multer({ dest: "uploads/" });

const youtube = google.youtube("v3");

const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    "http://localhost:5000/oauth2callback" // Redirect URI (not strictly used for refresh token flow but required)
);

// Set credentials globally if using a single platform account
if (process.env.YOUTUBE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
        refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
    });
}

export const uploadMiddleware = upload.single("video");

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

        // Ensure credentials are set (in case env vars loaded late)
        if (!process.env.YOUTUBE_REFRESH_TOKEN) {
            throw new Error("YOUTUBE_REFRESH_TOKEN is not defined in environment variables");
        }

        // Always refresh credentials before upload to be safe
        oauth2Client.setCredentials({
            refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
        });

        // Upload to YouTube
        const fileSize = fs.statSync(req.file.path).size;
        const resYoutube = await youtube.videos.insert({
            auth: oauth2Client,
            part: ["snippet", "status"],
            requestBody: {
                snippet: {
                    title: title,
                    description: `Uploaded by trainer via Velocity Platform for workshop: ${workshop.title}`,
                },
                status: {
                    privacyStatus: "unlisted", // Default to unlisted
                },
            },
            media: {
                body: fs.createReadStream(req.file.path),
            },
        });

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        const youtubeId = resYoutube.data.id;
        const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;

        const video = await prisma.video.create({
            data: {
                title,
                url: youtubeUrl,
                trainerId: userId,
                workshopId: workshopId,
            },
        });

        return res.status(201).json({
            success: true,
            data: video,
            message: "Video uploaded and posted successfully",
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
    } catch (error) {
        console.error("Error fetching videos:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
