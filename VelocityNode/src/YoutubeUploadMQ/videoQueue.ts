import { Queue } from "bullmq";
import { redisClient } from "./Redis";

export const videoUploadQueue = new Queue("video-upload-queue", {
    connection: redisClient,
});

export interface VideoUploadJobData {
    type: 'upload';
    title: string;
    workshopId: string;
    userId: string;
    description?: string;
    filePath: string;
}

export interface VideoDeleteJobData {
    type: 'delete';
    youtubeId: string;
    userId: string;
}

export type VideoJobData = VideoUploadJobData | VideoDeleteJobData;
