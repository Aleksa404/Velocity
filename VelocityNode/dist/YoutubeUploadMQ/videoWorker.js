"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoUploadWorker = void 0;
const bullmq_1 = require("bullmq");
const Redis_1 = require("./Redis");
const fs_1 = __importDefault(require("fs"));
const googleapis_1 = require("googleapis");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const youtube = googleapis_1.google.youtube("v3");
const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET, "http://localhost:5000/oauth2callback");
exports.videoUploadWorker = new bullmq_1.Worker("video-upload-queue", async (job) => {
    // Shared auth setup
    if (!process.env.YOUTUBE_REFRESH_TOKEN) {
        throw new Error("YOUTUBE_REFRESH_TOKEN is not defined");
    }
    oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
    switch (job.name) {
        case "video-upload": {
            if (job.data.type !== 'upload')
                throw new Error("Invalid job data for video-upload");
            const { title, workshopId, userId, filePath } = job.data;
            console.log(`Processing upload job ${job.id}: ${title}`);
            try {
                const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
                if (!workshop)
                    throw new Error("Workshop not found");
                const resYoutube = await youtube.videos.insert({
                    auth: oauth2Client,
                    part: ["snippet", "status"],
                    requestBody: {
                        snippet: { title, description: `Uploaded via Velocity for: ${workshop.title}` },
                        status: { privacyStatus: "unlisted" },
                    },
                    media: { body: fs_1.default.createReadStream(filePath) },
                });
                if (fs_1.default.existsSync(filePath))
                    fs_1.default.unlinkSync(filePath);
                const youtubeId = resYoutube.data.id;
                const video = await prisma.video.create({
                    data: {
                        title,
                        url: `https://www.youtube.com/watch?v=${youtubeId}`,
                        trainerId: userId,
                        workshopId,
                    },
                });
                console.log(`Video uploaded: ${video.id}`);
                return video;
            }
            catch (error) {
                if (fs_1.default.existsSync(filePath))
                    fs_1.default.unlinkSync(filePath);
                throw error;
            }
        }
        case "video-delete": {
            if (job.data.type !== 'delete')
                throw new Error("Invalid job data for video-delete");
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
}, {
    connection: Redis_1.redisClient,
    concurrency: 1, // Upload one at a time to avoid bandwidth/quota issues
});
//# sourceMappingURL=videoWorker.js.map