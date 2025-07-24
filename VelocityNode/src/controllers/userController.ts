import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiResponse, UserLoginResponse } from "../types/ApiResponse";

const prisma = new PrismaClient();

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
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

export const getCurrentUser = async (req: Request, res: Response) => {
  console.log("ovde");
  try {
    const { id } = req.user!;
    if (!id) {
      return res.status(401).json({ message: "Unauthorized: Missing userId" });
    }
    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (!currentUser) return res.status(404).json("user not found");
    const responseUser: UserLoginResponse = {
      id: currentUser.id,
      email: currentUser.email,
      firstName: currentUser?.first_name,
      lastName: currentUser?.last_name,
      role: currentUser?.role,
      createdAt: currentUser?.createdAt,
      updatedAt: currentUser?.updatedAt,
    };
    return res.status(200).json(responseUser);
  } catch (error) {
    return res.status(500).json("internal server error");
  }
};
