import { Queue } from "bullmq";
import { redisClient } from "./Redis";

export const videoUploadQueue = new Queue("video-upload-queue", {
    connection: redisClient,
});

export type StorageType = "LOCAL" | "YOUTUBE";

export interface VideoUploadJobData {
    type: "upload";
    title: string;
    workshopId: string;
    userId: string;
    description?: string;
    sectionId?: string;
    filePath: string;
    storageType: StorageType;
}

export interface VideoDeleteJobData {
    type: "delete";
    videoUrl: string;
    storageType: StorageType;
    userId: string;
}

export type VideoJobData = VideoUploadJobData | VideoDeleteJobData;
