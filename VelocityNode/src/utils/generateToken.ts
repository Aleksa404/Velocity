import "dotenv/config";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const generateAccessToken = (
  payload: object,
  expiresIn: string | number = "1h"
): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = async (
  userId: string,
  days: number = 7
) => {
  const token = crypto.randomBytes(40).toString("hex");
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

export const rotateRefreshToken = async (oldToken: string) => {
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
  const newToken = await generateRefreshToken(storedToken.userId);

  return { userId: storedToken.userId, refreshToken: newToken };
};
