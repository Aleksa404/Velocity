"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFollowers = exports.getFollowing = exports.unfollowTrainer = exports.followTrainer = exports.getTrainerProfile = exports.getAllTrainers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get all trainers
const getAllTrainers = async (req, res) => {
    try {
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
        });
        res.status(200).json({
            success: true,
            data: trainers,
            message: "Trainers fetched successfully",
        });
    }
    catch (error) {
        console.error("Error fetching trainers:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch trainers",
        });
    }
};
exports.getAllTrainers = getAllTrainers;
// Get trainer profile by ID
const getTrainerProfile = async (req, res) => {
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
                videos: {
                    orderBy: { uploadedAt: "desc" },
                    take: 10,
                },
                workshops: {
                    orderBy: { date: "desc" },
                    include: {
                        _count: {
                            select: {
                                enrollments: true,
                                videos: true,
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
            data: { ...trainer, isFollowing },
            message: "Trainer profile fetched successfully",
        });
    }
    catch (error) {
        console.error("Error fetching trainer profile:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch trainer profile",
        });
    }
};
exports.getTrainerProfile = getTrainerProfile;
// Follow a trainer
const followTrainer = async (req, res) => {
    try {
        const { id: trainerId } = req.params;
        const { id: userId } = req.user;
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
        // Create follow
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
    }
    catch (error) {
        console.error("Error following trainer:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to follow trainer",
        });
    }
};
exports.followTrainer = followTrainer;
// Unfollow a trainer
const unfollowTrainer = async (req, res) => {
    try {
        const { id: trainerId } = req.params;
        const { id: userId } = req.user;
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
    }
    catch (error) {
        console.error("Error unfollowing trainer:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to unfollow trainer",
        });
    }
};
exports.unfollowTrainer = unfollowTrainer;
// Get trainers that a user is following
const getFollowing = async (req, res) => {
    try {
        const { id: userId } = req.user;
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
    }
    catch (error) {
        console.error("Error fetching following:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch following list",
        });
    }
};
exports.getFollowing = getFollowing;
// Get followers of a trainer
const getFollowers = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error fetching followers:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch followers",
        });
    }
};
exports.getFollowers = getFollowers;
//# sourceMappingURL=trainerController.js.map