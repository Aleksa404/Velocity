"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
exports.redisClient = new ioredis_1.default(process.env.REDIS_URL, { maxRetriesPerRequest: null });
exports.redisClient.on('connect', () => {
    console.log('Redis connection established');
});
exports.redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});
//# sourceMappingURL=Redis.js.map