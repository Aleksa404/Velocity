"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotateRefreshToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
require("dotenv/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const generateAccessToken = (payload, expiresIn = "1H") => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const options = {
        expiresIn: expiresIn,
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = async (userId, days = 7) => {
    const token = crypto_1.default.randomBytes(40).toString("hex");
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    const refreshToken = await prisma.refreshToken.create({
        data: {
            token,
            userId,
            expiresAt: expires,
        },
    });
    return refreshToken.token;
};
exports.generateRefreshToken = generateRefreshToken;
const rotateRefreshToken = async (oldToken) => {
    const storedToken = await prisma.refreshToken.findUnique({
        where: { token: oldToken },
    });
    if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error("Invalid or expired refresh token");
    }
    // Delete old refresh token
    await prisma.refreshToken.delete({
        where: { token: oldToken },
    });
    // Issue new refresh token
    const newToken = await (0, exports.generateRefreshToken)(storedToken.userId);
    return { userId: storedToken.userId, refreshToken: newToken };
};
exports.rotateRefreshToken = rotateRefreshToken;
//# sourceMappingURL=generateToken.js.map