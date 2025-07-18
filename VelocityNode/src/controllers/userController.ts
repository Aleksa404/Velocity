import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiResponse } from "../types/ApiResponse";
import { Role } from "../types/Role";

const prisma = new PrismaClient();

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { name, email } = req.body;
  try {
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
};

export const deleteUserbyEmail = async (req: Request, res: Response) => {
  const { email } = req.params;
  try {
    const deletedUser = await prisma.user.delete({
      where: {
        email: email,
      },
    });
    res.status(200).json(deletedUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};

export const getUserRole = async (
  req: Request,
  res: Response<ApiResponse<string>>
) => {
  const { id } = req.params;
  try {
    const userRole = await prisma.user.findUnique({
      where: { id: id },
      select: { role: true },
    });
    if (!userRole) {
      const response: ApiResponse<string> = {
        success: false,
        data: null,
        message: "User not found",
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<string> = {
      success: true,
      data: userRole?.role || null,
      message: "User role fetched successfully",
    };
    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse<string> = {
      success: false,
      data: null,
      message: error.message || "Failed to fetch user role",
    };
    res.status(500).json(response);
  }
};

export const updateUserRole = async (
  req: Request,
  res: Response<ApiResponse<any>>
) => {
  const { id } = req.params;
  const { role } = req.body;
  console.log("Updating user role for ID:", id, "to role:", role);
  try {
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: { role: role },
    });

    const response: ApiResponse<typeof updatedUser> = {
      success: true,
      data: updatedUser,
      message: "User role updated successfully",
    };

    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: error.message || "Failed to update user role",
    };
    res.status(500).json(response);
  }
};
