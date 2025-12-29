import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiResponse } from "../types/ApiResponse";

const prisma = new PrismaClient();


export const createTrainerRequest = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: userId } = req.user!;
        const { message } = req.body;

        // Check if user already has a pending request
        const existingRequest = await prisma.trainerRequest.findFirst({
            where: {
                userId,
                status: "PENDING",
            },
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "You already have a pending trainer request",
            });
        }

        // Check if user is already a trainer
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.role === "TRAINER" || user?.role === "ADMIN") {
            return res.status(400).json({
                success: false,
                data: null,
                message: "You are already a trainer or admin",
            });
        }

        const trainerRequest = await prisma.trainerRequest.create({
            data: {
                userId,
                message,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: trainerRequest,
            message: "Trainer request submitted successfully",
        });
    } catch (error: any) {
        console.error("Error creating trainer request:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to create trainer request",
        });
    }
};

// admin only
export const getAllTrainerRequests = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const requests = await prisma.trainerRequest.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json({
            success: true,
            data: requests,
            message: "Trainer requests fetched successfully",
        });
    } catch (error: any) {
        console.error("Error fetching trainer requests:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch trainer requests",
        });
    }
};

//admin only
export const getPendingTrainerRequests = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const requests = await prisma.trainerRequest.findMany({
            where: {
                status: "PENDING",
            },
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json({
            success: true,
            data: requests,
            message: "Pending trainer requests fetched successfully",
        });
    } catch (error: any) {
        console.error("Error fetching pending trainer requests:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch pending trainer requests",
        });
    }
};


export const approveTrainerRequest = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id } = req.params;

        const request = await prisma.trainerRequest.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Trainer request not found",
            });
        }

        if (request.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                data: null,
                message: "This request has already been processed",
            });
        }

        // Update user role to TRAINER and request status to APPROVED
        const [updatedRequest, updatedUser] = await prisma.$transaction([
            prisma.trainerRequest.update({
                where: { id },
                data: { status: "APPROVED" },
                include: {
                    user: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            }),
            prisma.user.update({
                where: { id: request.userId },
                data: { role: "TRAINER" },
            }),
        ]);

        res.status(200).json({
            success: true,
            data: updatedRequest,
            message: "Trainer request approved successfully",
        });
    } catch (error: any) {
        console.error("Error approving trainer request:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to approve trainer request",
        });
    }
};

export const denyTrainerRequest = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id } = req.params;

        const request = await prisma.trainerRequest.findUnique({
            where: { id },
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Trainer request not found",
            });
        }

        if (request.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                data: null,
                message: "This request has already been processed",
            });
        }

        const updatedRequest = await prisma.trainerRequest.update({
            where: { id },
            data: { status: "DENIED" },
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        res.status(200).json({
            success: true,
            data: updatedRequest,
            message: "Trainer request denied",
        });
    } catch (error: any) {
        console.error("Error denying trainer request:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to deny trainer request",
        });
    }
};


export const getUserTrainerRequest = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: userId } = req.user!;

        const request = await prisma.trainerRequest.findFirst({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json({
            success: true,
            data: request,
            message: request
                ? "Trainer request fetched successfully"
                : "No trainer request found",
        });
    } catch (error: any) {
        console.error("Error fetching user trainer request:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch trainer request",
        });
    }
};
