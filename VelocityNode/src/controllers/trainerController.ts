import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiResponse } from "../types/ApiResponse";

const prisma = new PrismaClient();


export const getAllTrainers = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const currentUserId = req.user?.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 12;
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const total = await prisma.user.count({
            where: {
                role: "TRAINER",
            },
        });

        const trainers = await prisma.user.findMany({
            where: {
                role: "TRAINER",
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        followers: true,
                        videos: true,
                        workshops: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        });

        // If user is logged in, check which trainers they're following
        let trainersWithFollowStatus = trainers;
        if (currentUserId) {
            const userFollows = await prisma.follow.findMany({
                where: {
                    userId: currentUserId,
                    trainerId: { in: trainers.map(t => t.id) },
                },
                select: { trainerId: true },
            });
            const followingSet = new Set(userFollows.map(f => f.trainerId));

            trainersWithFollowStatus = trainers.map(trainer => ({
                ...trainer,
                isFollowing: followingSet.has(trainer.id),
            }));
        } else {
            trainersWithFollowStatus = trainers.map(trainer => ({
                ...trainer,
                isFollowing: false,
            }));
        }

        res.status(200).json({
            success: true,
            data: {
                trainers: trainersWithFollowStatus,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
            message: "Trainers fetched successfully",
        });
    } catch (error: any) {
        console.error("Error fetching trainers:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch trainers",
        });
    }
};


export const searchTrainers = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { query } = req.query;

        if (!query || typeof query !== "string") {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Search query is required",
            });
        }

        const trainers = await prisma.user.findMany({
            where: {
                role: "TRAINER",
                OR: [
                    { first_name: { contains: query as string } },
                    { last_name: { contains: query as string } },
                ],
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                role: true,

            },
            take: 5, // Limit results
        });

        res.status(200).json({
            success: true,
            data: trainers,
            message: "Trainers found successfully",
        });
    } catch (error: any) {
        console.error("Error searching trainers:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to search trainers",
        });
    }
};


export const getTrainerProfile = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user?.id;

        const trainer = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                role: true,
                createdAt: true,
                workshops: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        videos: {
                            include: {
                                watchProgress: currentUserId ? {
                                    where: { userId: currentUserId }
                                } : false
                            }
                        },
                        _count: {
                            select: {
                                enrollments: true,
                                videos: true,
                                sections: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        followers: true,
                        videos: true,
                        workshops: true,
                    },
                },
            },
        });

        if (!trainer) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Trainer not found",
            });
        }

        if (trainer.role !== "TRAINER") {
            return res.status(400).json({
                success: false,
                data: null,
                message: "User is not a trainer",
            });
        }

        // Check enrollment status for each workshop if user is logged in
        let workshopsWithStatus = trainer.workshops;
        if (currentUserId) {
            const userEnrollments = await prisma.workshopEnrollment.findMany({
                where: {
                    userId: currentUserId,
                    workshopId: { in: trainer.workshops.map(w => w.id) }
                }
            });
            const enrollmentMap = new Map(userEnrollments.map(e => [e.workshopId, e.status]));

            workshopsWithStatus = trainer.workshops.map(workshop => ({
                ...workshop,
                enrollmentStatus: enrollmentMap.get(workshop.id) || null
            }));
        }

        // Check if current user is following this trainer
        let isFollowing = false;
        if (currentUserId) {
            const follow = await prisma.follow.findUnique({
                where: {
                    userId_trainerId: {
                        userId: currentUserId,
                        trainerId: id,
                    },
                },
            });
            isFollowing = !!follow;
        }

        res.status(200).json({
            success: true,
            data: { ...trainer, workshops: workshopsWithStatus, isFollowing },
            message: "Trainer profile fetched successfully",
        });
    } catch (error: any) {
        console.error("Error fetching trainer profile:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch trainer profile",
        });
    }
};


export const followTrainer = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: trainerId } = req.params;
        const { id: userId } = req.user!;

        // Check if trying to follow self
        if (userId === trainerId) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "You cannot follow yourself",
            });
        }

        // Check if trainer exists and is a trainer
        const trainer = await prisma.user.findUnique({
            where: { id: trainerId },
        });

        if (!trainer) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Trainer not found",
            });
        }

        if (trainer.role !== "TRAINER") {
            return res.status(400).json({
                success: false,
                data: null,
                message: "User is not a trainer",
            });
        }

        // Check if already following
        const existingFollow = await prisma.follow.findUnique({
            where: {
                userId_trainerId: {
                    userId,
                    trainerId,
                },
            },
        });

        if (existingFollow) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Already following this trainer",
            });
        }


        const follow = await prisma.follow.create({
            data: {
                userId,
                trainerId,
            },
        });

        res.status(201).json({
            success: true,
            data: follow,
            message: "Successfully followed trainer",
        });
    } catch (error: any) {
        console.error("Error following trainer:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to follow trainer",
        });
    }
};


export const unfollowTrainer = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: trainerId } = req.params;
        const { id: userId } = req.user!;

        const follow = await prisma.follow.findUnique({
            where: {
                userId_trainerId: {
                    userId,
                    trainerId,
                },
            },
        });

        if (!follow) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Not following this trainer",
            });
        }

        await prisma.follow.delete({
            where: {
                userId_trainerId: {
                    userId,
                    trainerId,
                },
            },
        });

        res.status(200).json({
            success: true,
            data: null,
            message: "Successfully unfollowed trainer",
        });
    } catch (error: any) {
        console.error("Error unfollowing trainer:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to unfollow trainer",
        });
    }
};

// Get trainers that a user is following
export const getFollowing = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: userId } = req.user!;

        const following = await prisma.follow.findMany({
            where: { userId },
            include: {
                trainer: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        role: true,
                        _count: {
                            select: {
                                followers: true,
                                videos: true,
                                workshops: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json({
            success: true,
            data: following,
            message: "Following list fetched successfully",
        });
    } catch (error: any) {
        console.error("Error fetching following:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch following list",
        });
    }
};

// Get followers of a trainer
export const getFollowers = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: trainerId } = req.params;

        const followers = await prisma.follow.findMany({
            where: { trainerId },
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        role: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json({
            success: true,
            data: followers,
            message: "Followers fetched successfully",
        });
    } catch (error: any) {
        console.error("Error fetching followers:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch followers",
        });
    }
};
