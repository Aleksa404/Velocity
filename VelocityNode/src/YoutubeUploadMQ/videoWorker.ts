import { Worker } from "bullmq";
import { redisClient } from "./Redis";
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import { VideoJobData } from "./videoQueue";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
} else if (process.env.FFMPEG_PATH) {
    // In Docker (Alpine), ffmpeg-static's glibc binary won't work.
    // Fall back to the system binary set via FFMPEG_PATH env var.
    ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
} else {
    console.warn('No ffmpeg-static binary found; falling back to system ffmpeg on PATH');
}

// Directory for storing compressed videos
const VIDEOS_DIR = path.join(__dirname, "../../videos");

// Ensure videos directory exists
if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// YouTube API setup
const youtube = google.youtube("v3");

const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    "http://localhost:5000/oauth2callback"
);


// Compress video using FFmpeg
function compressVideo(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                "-c:v libx264",           // H.264 codec for broad compatibility
                "-crf 28",                // Compression quality (23-28 is good balance)
                "-preset fast",           // Encoding speed/quality tradeoff
                "-c:a aac",               // AAC audio codec
                "-b:a 128k",              // Audio bitrate
                "-movflags +faststart",   // Enable streaming before full download
                "-vf scale='min(1280,iw)':'-2'" // Max width 1280, maintain aspect ratio
            ])
            .output(outputPath)
            .on("start", (cmd) => {
                console.log(`[FFmpeg] Started: ${cmd}`);
            })
            .on("end", () => {
                console.log(`[FFmpeg] Compression complete: ${outputPath}`);
                resolve();
            })
            .on("error", (err) => {
                console.error(`[FFmpeg] Error: ${err.message}`);
                reject(err);
            })
            .run();
    });
}


// Get video duration using FFmpeg
function getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                const duration = metadata.format.duration || 0;
                resolve(Math.floor(duration));
            }
        });
    });
}


// Upload video to LOCAL storage
async function uploadToLocal(
    filePath: string,
    title: string,
    description: string | undefined,
    workshopId: string,
    userId: string,
    jobId: string | undefined
): Promise<{ url: string; duration: number }> {
    // Generate unique filename
    const fileId = uuidv4();
    const outputFilename = `${fileId}.mp4`;
    const outputPath = path.join(VIDEOS_DIR, outputFilename);

    // Compress video
    console.log(`[Job ${jobId}] Starting local compression...`);
    await compressVideo(filePath, outputPath);

    // Get video duration
    const duration = await getVideoDuration(outputPath);
    console.log(`[Job ${jobId}] Video duration: ${duration}s`);

    // Delete original upload file
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Job ${jobId}] Cleaned up temp file`);
    }

    return {
        url: `/api/videos/stream/${outputFilename}`,
        duration,
    };
}


// Upload video to YOUTUBE
async function uploadToYouTube(
    filePath: string,
    title: string,
    description: string | undefined,
    workshopId: string,
    userId: string,
    jobId: string | undefined
): Promise<{ url: string; duration: number }> {
    // Check for YouTube credentials
    if (!process.env.YOUTUBE_REFRESH_TOKEN) {
        throw new Error("YOUTUBE_REFRESH_TOKEN is not defined");
    }
    oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });

    // Get workshop for description
    const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
    const videoDescription = description
        ? `${description}\n\nUploaded via Velocity for: ${workshop?.title || "Workshop"}`
        : `Uploaded via Velocity for: ${workshop?.title || "Workshop"}`;

    console.log(`[Job ${jobId}] Verifying YouTube credentials...`);
    const creds = await oauth2Client.getAccessToken();
    console.log(`[Job ${jobId}] Creds valid? ${!!creds.token}`);

    console.log(`[Job ${jobId}] Starting YouTube upload...`);
    const fileSize = fs.statSync(filePath).size;
    console.log(`[Job ${jobId}] File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

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

    console.log(`[Job ${jobId}] Upload request completed. Status: ${resYoutube.status}`);
    let duration = 0;
    try {
        duration = await getVideoDuration(filePath);
        console.log(`[Job ${jobId}] Calculated duration: ${duration}s`);
    } catch (err) {
        console.error(`[Job ${jobId}] Failed to calculate duration:`, err);
    }

    // Clean up temp file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const youtubeId = resYoutube.data.id;
    if (!youtubeId) throw new Error("No YouTube ID returned");

    return {
        url: `https://www.youtube.com/watch?v=${youtubeId}`,
        duration,
    };
}



function deleteFromLocal(videoUrl: string, jobId: string | undefined): void {
    const filename = videoUrl.split("/").pop();
    if (!filename) {
        console.log(`[Job ${jobId}] No filename found in URL: ${videoUrl}`);
        return;
    }

    const filePath = path.join(VIDEOS_DIR, filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Job ${jobId}] Deleted local file: ${filename}`);
    } else {
        console.log(`[Job ${jobId}] Local file not found: ${filename}`);
    }
}



async function deleteFromYouTube(videoUrl: string, jobId: string | undefined): Promise<void> {
    if (!process.env.YOUTUBE_REFRESH_TOKEN) {
        throw new Error("YOUTUBE_REFRESH_TOKEN is not defined");
    }
    oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });

    // Extract YouTube video ID from URL
    // https://www.youtube.com/watch?v=VIDEO_ID
    const youtubeId = videoUrl.split("v=")[1]?.split("&")[0];
    if (!youtubeId) {
        console.log(`[Job ${jobId}] Could not extract YouTube ID from: ${videoUrl}`);
        return;
    }

    console.log(`[Job ${jobId}] Deleting YouTube video: ${youtubeId}`);
    await youtube.videos.delete({
        auth: oauth2Client,
        id: youtubeId,
    });
    console.log(`[Job ${jobId}] YouTube video deleted: ${youtubeId}`);
}

export const videoUploadWorker = new Worker<VideoJobData>(
    "video-upload-queue",
    async (job) => {
        switch (job.name) {
            case "video-upload": {
                if (job.data.type !== "upload") throw new Error("Invalid job data for video-upload");
                const { title, description, workshopId, sectionId, userId, filePath, storageType } = job.data;
                console.log(`[Job ${job.id}] Processing ${storageType} upload: ${title}`);

                try {
                    // Verify workshop exists
                    const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
                    if (!workshop) throw new Error("Workshop not found");

                    let result: { url: string; duration: number };

                    if (storageType === "YOUTUBE") {
                        result = await uploadToYouTube(filePath, title, description, workshopId, userId, job.id);
                    } else {
                        result = await uploadToLocal(filePath, title, description, workshopId, userId, job.id);
                    }

                    // Save to database
                    const video = await prisma.video.create({
                        data: {
                            title,
                            description,
                            url: result.url,
                            storageType: storageType,
                            duration: result.duration || null,
                            trainerId: userId,
                            workshopId,
                            sectionId,
                        },
                    });

                    console.log(`[Job ${job.id}] Video saved to DB: ${video.id} (${storageType})`);
                    return video;
                } catch (error: any) {
                    console.error(`[Job ${job.id}] Upload FAILED:`, error);
                    if (error.response) {
                        console.error(`[Job ${job.id}] API Error Data:`, error.response.data);
                    }
                    // Clean up temp file on error
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    throw error;
                }
            }
            case "video-delete": {
                if (job.data.type !== "delete") throw new Error("Invalid job data for video-delete");
                const { videoUrl, storageType } = job.data;
                console.log(`[Job ${job.id}] Processing ${storageType} delete: ${videoUrl}`);

                try {
                    if (storageType === "YOUTUBE") {
                        await deleteFromYouTube(videoUrl, job.id);
                    } else {
                        deleteFromLocal(videoUrl, job.id);
                    }
                    return { deleted: true };
                } catch (error: any) {
                    console.error(`[Job ${job.id}] Delete FAILED:`, error);
                    throw error;
                }
            }
            default:
                throw new Error(`Unknown job name: ${job.name}`);
        }
    },
    {
        connection: redisClient,
        removeOnComplete: { count: 100 },
        concurrency: 1, // Lower concurrency for video processing (CPU intensive)
    }
);
