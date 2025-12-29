import { Worker } from "bullmq";
import { redisClient } from "./Redis";
import fs from "fs";
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import { VideoJobData } from "./videoQueue";

const prisma = new PrismaClient();

const youtube = google.youtube("v3");

const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    "http://localhost:5000/oauth2callback"
);

export const videoUploadWorker = new Worker<VideoJobData>(
    "video-upload-queue",
    async (job) => {
        // Shared auth setup
        if (!process.env.YOUTUBE_REFRESH_TOKEN) {
            throw new Error("YOUTUBE_REFRESH_TOKEN is not defined");
        }
        oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });

        switch (job.name) {
            case "video-upload": {
                if (job.data.type !== 'upload') throw new Error("Invalid job data for video-upload");
                const { title, description, workshopId, userId, filePath } = job.data;
                console.log(`Processing upload job ${job.id}: ${title}`);

                try {
                    const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
                    if (!workshop) throw new Error("Workshop not found");

                    const videoDescription = description
                        ? `${description}\n\nUploaded via Velocity for: ${workshop.title}`
                        : `Uploaded via Velocity for: ${workshop.title}`;

                    console.log(`[Job ${job.id}] Verifying credentials...`);
                    // Force a token refresh check or at least verify client has credentials
                    const creds = await oauth2Client.getAccessToken(); // This might trigger refresh
                    console.log(`[Job ${job.id}] Creds valid? ${!!creds.token}`);

                    console.log(`[Job ${job.id}] Starting YouTube upload...`);
                    const fileSize = fs.statSync(filePath).size;
                    console.log(`[Job ${job.id}] File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

                    const resYoutube = await youtube.videos.insert({
                        auth: oauth2Client,
                        part: ["snippet", "status"],
                        requestBody: {
                            snippet: {
                                title,
                                description: videoDescription
                            },
                            status: { privacyStatus: "unlisted" },
                        },
                        media: { body: fs.createReadStream(filePath) },
                    });

                    console.log(`[Job ${job.id}] Upload request completed. Status: ${resYoutube.status}`);

                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                    const youtubeId = resYoutube.data.id;
                    if (!youtubeId) throw new Error("No YouTube ID returned");

                    const video = await prisma.video.create({
                        data: {
                            title,
                            description,
                            url: `https://www.youtube.com/watch?v=${youtubeId}`,
                            trainerId: userId,
                            workshopId,
                        },
                    });
                    console.log(`[Job ${job.id}] Video saved to DB: ${video.id}`);
                    return video;
                } catch (error: any) {
                    console.error(`[Job ${job.id}] Upload FAILED:`, error);
                    // Log specific axios/google error details if available
                    if (error.response) {
                        console.error(`[Job ${job.id}] API Error Data:`, error.response.data);
                    }
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    throw error;
                }
            }
            case "video-delete": {
                if (job.data.type !== 'delete') throw new Error("Invalid job data for video-delete");
                const { youtubeId } = job.data;
                console.log(`Processing delete job ${job.id}: ${youtubeId}`);

                await youtube.videos.delete({
                    auth: oauth2Client,
                    id: youtubeId,
                });
                console.log(`YouTube video deleted: ${youtubeId}`);
                return { deleted: true };
            }
            default:
                throw new Error(`Unknown job name: ${job.name}`);
        }
    },
    {
        connection: redisClient,
        concurrency: 5, // Process multiple jobs in parallel
    }
);
