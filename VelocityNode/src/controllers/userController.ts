import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiResponse, UserLoginResponse } from "../types/ApiResponse";
import { success } from "zod";

const prisma = new PrismaClient();

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 10);
    const search = (req.query.search as string)?.trim() || "";

    const skip = (page - 1) * limit;

    const whereClause = search
      ? {
        OR: [
          { first_name: { contains: search, mode: "insensitive" as const } },
          { last_name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      message: "Users fetched successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, data: null, message: "Failed to fetch users" });
  }
};


export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized", data: null });
  }
  try {
    const exists = await prisma.user.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ success: false, message: "User not found", data: null });
    }

    if (user.id === id || exists.role === "ADMIN") {
      return res.status(403).json({ success: false, message: "Cannot delete your own or admin accounts", data: null });
    }

    await prisma.user.delete({
      where: { id },
    });
    res.status(200).json({ success: true, message: "User deleted successfully", data: null });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user", data: null });
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
  res: Response<ApiResponse<null>>
) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    const validRoles = ["USER", "TRAINER", "ADMIN"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid role. Must be USER, TRAINER, or ADMIN",
      });
    }
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "User not found",
      });
    }
    if (id === req.user?.id || user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Cannot modify your own or other admin roles",
      });
    }

    await prisma.user.update({
      where: { id: id },
      data: { role: role },
    });



    res.status(200).json({
      success: true,
      data: null,
      message: "User role updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      data: null,
      message: "Failed to update user role",
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) { return res.status(401).json({ success: false, data: null, message: "Unauthorized" }) }
    const { id } = user;
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
