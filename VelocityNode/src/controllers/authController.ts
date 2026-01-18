import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import {
  ApiResponse,
  UserLoginResponse,
  UserTokenResponse,
} from "../types/ApiResponse";
import { User } from "../types/User";
import { registerUserSchema } from "../utils/authValidation.schema";
import {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
} from "../utils/generateToken";
import { success } from "zod";

const prisma = new PrismaClient();

export const registerUser = async (req: Request, res: Response) => {

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
      last_name: req.body.lastName,
      role: "USER",
    },
  });
  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = await generateRefreshToken(user.id);

  const responseUser: UserLoginResponse = {
    id: user.id,
    email: user.email,
    firstName: user?.first_name,
    lastName: user?.last_name,
    role: user?.role,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
  };

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
  });

  return res.status(201).json({
    success: true,
    data: { accessToken, user: responseUser },
    message: "User registered successfully",
  });
};

export const loginUser = async (req: Request, res: Response<ApiResponse<any>>) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({
    success: false,
    data: null,
    message: "Wrong email or password"
  });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({
    success: false,
    data: null,
    message: "Wrong email or password"
  });

  const responseUser: UserLoginResponse = {
    id: user.id,
    email: user.email,
    firstName: user?.first_name,
    lastName: user?.last_name,
    role: user?.role,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
  };

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = await generateRefreshToken(user.id);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return res.status(200).json({
    success: true,
    data: { accessToken, user: responseUser },
    message: "Login successful",
  });
};

export const logout = async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res
      .sendStatus(204);
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        data: null,
        message: "Internal server error"
      });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      data: null,
      message: "No refresh token provided"
    });
  }

  try {
    const { userId, refreshToken: newRefreshToken } = await rotateRefreshToken(
      refreshToken
    );

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const accessToken = generateAccessToken({
      id: userId,
      email: user?.email,
      role: user?.role,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
    });

    res.json({ accessToken, user });
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }
};
