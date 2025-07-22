import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { ApiResponse } from "../types/ApiResponse";
import { User } from "../types/User";

const prisma = new PrismaClient();

export const registerUser = async (
  req: Request,
  res: Response<ApiResponse<User>>
) => {
  const { email, password } = req.body;

  const exists = await prisma.user.findUnique({ where: { email: email } });
  if (exists)
    return res.status(400).json({
      success: false,
      data: null,
      message: "Email already exists",
      error: "Already taken",
    });

  const hashedPassword = await bcrypt.hash(password, 10);
};
export const loginUser = async (req: Request, res: Response) => {};
