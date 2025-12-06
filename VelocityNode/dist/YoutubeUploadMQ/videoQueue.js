"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoUploadQueue = void 0;
const bullmq_1 = require("bullmq");
const Redis_1 = require("./Redis");
exports.videoUploadQueue = new bullmq_1.Queue("video-upload-queue", {
    connection: Redis_1.redisClient,
});
//# sourceMappingURL=videoQueue.js.map