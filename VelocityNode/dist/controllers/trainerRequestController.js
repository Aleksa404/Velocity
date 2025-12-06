"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserTrainerRequest = exports.denyTrainerRequest = exports.approveTrainerRequest = exports.getPendingTrainerRequests = exports.getAllTrainerRequests = exports.createTrainerRequest = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Create a trainer request
const createTrainerRequest = async (req, res) => {
    try {
        const { id: userId } = req.user;
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
    }
    catch (error) {
        console.error("Error creating trainer request:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to create trainer request",
        });
    }
};
exports.createTrainerRequest = createTrainerRequest;
// Get all trainer requests (admin only)
const getAllTrainerRequests = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error fetching trainer requests:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch trainer requests",
        });
    }
};
exports.getAllTrainerRequests = getAllTrainerRequests;
// Get pending trainer requests (admin only)
const getPendingTrainerRequests = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error fetching pending trainer requests:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch pending trainer requests",
        });
    }
};
exports.getPendingTrainerRequests = getPendingTrainerRequests;
// Approve a trainer request
const approveTrainerRequest = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error approving trainer request:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to approve trainer request",
        });
    }
};
exports.approveTrainerRequest = approveTrainerRequest;
// Deny a trainer request
const denyTrainerRequest = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error denying trainer request:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to deny trainer request",
        });
    }
};
exports.denyTrainerRequest = denyTrainerRequest;
// Get current user's trainer request
const getUserTrainerRequest = async (req, res) => {
    try {
        const { id: userId } = req.user;
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
    }
    catch (error) {
        console.error("Error fetching user trainer request:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch trainer request",
        });
    }
};
exports.getUserTrainerRequest = getUserTrainerRequest;
//# sourceMappingURL=trainerRequestController.js.map