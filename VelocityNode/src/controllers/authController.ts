import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { ApiResponse } from "../types/ApiResponse";
import { User } from "../types/User";
import { registerUserSchema } from "../utils/authValidation.schema";
import { sign } from "crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
} from "../utils/generateToken";

const prisma = new PrismaClient();

export const registerUser = async (req: Request, res: Response) => {
  console.log("Registering user:", req.body);
  const result = registerUserSchema.safeParse(req.body);

  if (!result.success) {
    const formatetErrors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return res.status(400).json({
      success: false,
      data: null,
      errors: formatetErrors,
    });
  }

  const { email, password } = req.body;

  const exists = await prisma.user.findUnique({ where: { email: email } });
  if (exists)
    return res.status(400).json({
      success: false,
      data: null,
      message: "Email already exists",
    });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      first_name: req.body.firstName,
      last_name: req.body.lastName || "",
    },
  });
  const token = generateAccessToken({ id: user.id, email: user.email });
  return res.status(201).json({
    success: true,
    data: token,
    message: "User registered successfully",
  });
};
export const loginUser = async (req: Request, res: Response) => {};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body; // Or from cookie

  // if (refreshToken) {
  //   await prisma.user.updateMany({
  //     where: { refreshTokens: { has: refreshToken } },
  //     data: { refreshTokens: { set: [] } }, // Or remove specific token
  //   });
  // }
  res.status(204).send();
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  try {
    const { userId, refreshToken: newRefreshToken } = await rotateRefreshToken(
      refreshToken
    );

    const accessToken = generateAccessToken({ userId }, "15m");

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }
};
