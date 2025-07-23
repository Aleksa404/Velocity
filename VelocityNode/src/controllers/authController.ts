import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { ApiResponse } from "../types/ApiResponse";
import { User } from "../types/User";
import { registerUserSchema } from "../utils/authValidation.schema";
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
  const accessToken = generateAccessToken({ id: user.id, email: user.email });
  const refreshToken = await generateRefreshToken(user.id);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(201).json({
    success: true,
    data: { accessToken, user: { id: user.id, email: user.email } },
    message: "User registered successfully",
  });
};
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const accessToken = generateAccessToken({ id: user.id, email: user.email });
  const refreshToken = await generateRefreshToken(user.id);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(200).json({
    success: true,
    data: { accessToken, user: user },
    message: "Login successful",
  });
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  res.status(204).send();
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  try {
    const { userId, refreshToken: newRefreshToken } = await rotateRefreshToken(
      refreshToken
    );

    // Get user info for consistent payload
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const accessToken = generateAccessToken({
      id: userId,
      email: user?.email,
      role: user?.role,
    });

    // Set new refresh token cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }
};
