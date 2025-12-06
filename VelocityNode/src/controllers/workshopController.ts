import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiResponse } from "../types/ApiResponse";

const prisma = new PrismaClient();

// Create a workshop 
export const createWorkshop = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: trainerId, role } = req.user!;
        const { title, description, date, capacity } = req.body;

        if (role !== "TRAINER" && role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                data: null,
                message: "Only trainers can create workshops",
            });
        }

        const workshop = await prisma.workshop.create({
            data: {
                title,
                description,
                date: new Date(date),
                capacity: capacity ? parseInt(capacity) : null,
                trainerId,
            },
            include: {
                trainer: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        enrollments: {
                            where: { status: "APPROVED" },
                        },
                        videos: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: workshop,
            message: "Workshop created successfully",
        });
    } catch (error: any) {
        console.error("Error creating workshop:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to create workshop",
        });
    }
};

// Get all workshops
export const getAllWorkshops = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const currentUserId = req.user?.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        // If user is logged in, get trainers they follow
        let followedTrainerIds: string[] = [];
        if (!currentUserId)
            return res.status(401).json({
                success: false,
                data: null,
                message: "Unauthorized",
            })
        const followedTrainers = await prisma.follow.findMany({
            where: { userId: currentUserId },
            select: { trainerId: true },
        });
        followedTrainerIds = followedTrainers.map(f => f.trainerId);


        // If user doesn't follow anyone, return empty
        if (followedTrainerIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "No workshops found. Follow trainers to see their workshops.",
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0,
                },
            } as any);
        }

        const [workshops, total] = await Promise.all([
            prisma.workshop.findMany({
                where: {
                    trainerId: { in: followedTrainerIds },
                },
                skip: skip,
                take: limit,
                include: {
                    trainer: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            role: true,
                        },
                    },
                    _count: {
                        select: {
                            enrollments: {
                                where: { status: "APPROVED" },
                            },
                            videos: true,
                        },
                    },
                },
                orderBy: {
                    date: "desc",
                },
            }),
            prisma.workshop.count({
                where: {
                    trainerId: { in: followedTrainerIds },
                },
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        // check enrollment status for each workshop

        const workshopsWithStatus = await Promise.all(
            workshops.map(async (workshop) => {
                const enrollment = await prisma.workshopEnrollment.findUnique({
                    where: {
                        userId_workshopId: {
                            userId: currentUserId,
                            workshopId: workshop.id,
                        },
                    },
                });

                return {
                    ...workshop,
                    enrollmentStatus: enrollment?.status || null,
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: workshopsWithStatus,
            message: "Workshops fetched successfully",
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        } as any);

    } catch (error: any) {
        console.error("Error fetching workshops:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch workshops",
        });
    }
};

// Get workshop by ID
export const getWorkshopById = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user?.id;

        const workshop = await prisma.workshop.findUnique({
            where: { id },
            include: {
                trainer: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
                videos: {
                    orderBy: { uploadedAt: "desc" },
                    include: {
                        trainer: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                            },
                        },
                        watchProgress: currentUserId ? {
                            where: { userId: currentUserId },
                            select: {
                                watchedSeconds: true,
                                totalDuration: true,
                                percentWatched: true,
                                isCompleted: true,
                                lastWatchedAt: true,
                            }
                        } : false,
                    },
                },
                _count: {
                    select: {
                        enrollments: {
                            where: { status: "APPROVED" },
                        },
                        videos: true,
                    },
                },
            },
        });

        if (!workshop) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Workshop not found",
            });
        }

        // Check enrollment status if user is logged in
        let enrollmentStatus = null;
        if (currentUserId) {
            const enrollment = await prisma.workshopEnrollment.findUnique({
                where: {
                    userId_workshopId: {
                        userId: currentUserId,
                        workshopId: id,
                    },
                },
            });
            enrollmentStatus = enrollment?.status || null;
        }

        const isTrainer = workshop.trainerId === currentUserId;
        const isEnrolled = enrollmentStatus === "APPROVED";

        // Remove videos if not trainer and not enrolled/approved
        if (!isTrainer && !isEnrolled) {
            (workshop as any).videos = [];
        }

        res.status(200).json({
            success: true,
            data: { ...workshop, enrollmentStatus },
            message: "Workshop fetched successfully",
        });
    } catch (error: any) {
        console.error("Error fetching workshop:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch workshop",
        });
    }
};

// Update workshop (owner only)
export const updateWorkshop = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id } = req.params;
        const { id: userId } = req.user!;
        const { title, description, date, capacity } = req.body;

        const workshop = await prisma.workshop.findUnique({
            where: { id },
        });

        if (!workshop) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Workshop not found",
            });
        }

        if (workshop.trainerId !== userId) {
            return res.status(403).json({
                success: false,
                data: null,
                message: "You can only update your own workshops",
            });
        }

        const updatedWorkshop = await prisma.workshop.update({
            where: { id },
            data: {
                title,
                description,
                date: date ? new Date(date) : undefined,
                capacity: capacity !== undefined ? (capacity ? parseInt(capacity) : null) : undefined,
            },
            include: {
                trainer: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        enrollments: {
                            where: { status: "APPROVED" },
                        },
                        videos: true,
                    },
                },
            },
        });

        res.status(200).json({
            success: true,
            data: updatedWorkshop,
            message: "Workshop updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating workshop:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to update workshop",
        });
    }
};

// Delete workshop (owner only)
export const deleteWorkshop = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id } = req.params;
        const { id: userId } = req.user!;

        const workshop = await prisma.workshop.findUnique({
            where: { id },
        });

        if (!workshop) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Workshop not found",
            });
        }

        if (workshop.trainerId !== userId) {
            return res.status(403).json({
                success: false,
                data: null,
                message: "You can only delete your own workshops",
            });
        }

        await prisma.workshop.delete({
            where: { id },
        });

        res.status(200).json({
            success: true,
            data: null,
            message: "Workshop deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting workshop:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to delete workshop",
        });
    }
};

// Enroll in workshop
export const enrollInWorkshop = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: workshopId } = req.params;
        const { id: userId } = req.user!;

        const workshop = await prisma.workshop.findUnique({
            where: { id: workshopId },
            include: {
                _count: {
                    select: {
                        enrollments: {
                            where: { status: "APPROVED" },
                        },
                    },
                },
            },
        });

        if (!workshop) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Workshop not found",
            });
        }

        // Check if workshop is full
        if (workshop.capacity && workshop._count.enrollments >= workshop.capacity) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Workshop is at full capacity",
            });
        }

        // Check if already enrolled
        const existingEnrollment = await prisma.workshopEnrollment.findUnique({
            where: {
                userId_workshopId: {
                    userId,
                    workshopId,
                },
            },
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Already enrolled in this workshop",
            });
        }

        const enrollment = await prisma.workshopEnrollment.create({
            data: {
                userId,
                workshopId,
            },
            include: {
                workshop: {
                    include: {
                        trainer: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: enrollment,
            message: "Enrollment request submitted successfully",
        });
    } catch (error: any) {
        console.error("Error enrolling in workshop:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to enroll in workshop",
        });
    }
};

// Get workshop enrollments (owner only)
export const getWorkshopEnrollments = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: workshopId } = req.params;
        const { id: userId } = req.user!;

        const workshop = await prisma.workshop.findUnique({
            where: { id: workshopId },
        });

        if (!workshop) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Workshop not found",
            });
        }

        if (workshop.trainerId !== userId) {
            console.log(workshop.trainerId);
            console.log(userId);
            console.warn(`Access denied: User ${userId} tried to view enrollments for workshop ${workshopId} owned by ${workshop.trainerId}`);
            return res.status(403).json({
                success: false,
                data: null,
                message: "You can only view enrollments for your own workshops",
            });
        }

        const enrollments = await prisma.workshopEnrollment.findMany({
            where: { workshopId },
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
            data: enrollments,
            message: "Enrollments fetched successfully",
        });
    } catch (error: any) {
        console.error("Error fetching enrollments:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch enrollments",
        });
    }
};

// Approve enrollment
export const approveEnrollment = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: enrollmentId } = req.params;
        const { id: userId } = req.user!;

        const enrollment = await prisma.workshopEnrollment.findUnique({
            where: { id: enrollmentId },
            include: {
                workshop: true,
            },
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Enrollment not found",
            });
        }

        if (enrollment.workshop.trainerId !== userId) {
            return res.status(403).json({
                success: false,
                data: null,
                message: "You can only approve enrollments for your own workshops",
            });
        }

        if (enrollment.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                data: null,
                message: "This enrollment has already been processed",
            });
        }

        const updatedEnrollment = await prisma.workshopEnrollment.update({
            where: { id: enrollmentId },
            data: { status: "APPROVED" },
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
                workshop: {
                    include: {
                        trainer: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(200).json({
            success: true,
            data: updatedEnrollment,
            message: "Enrollment approved successfully",
        });
    } catch (error: any) {
        console.error("Error approving enrollment:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to approve enrollment",
        });
    }
};

// Deny enrollment
export const denyEnrollment = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: enrollmentId } = req.params;
        const { id: userId } = req.user!;

        const enrollment = await prisma.workshopEnrollment.findUnique({
            where: { id: enrollmentId },
            include: {
                workshop: true,
            },
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Enrollment not found",
            });
        }

        if (enrollment.workshop.trainerId !== userId) {
            return res.status(403).json({
                success: false,
                data: null,
                message: "You can only deny enrollments for your own workshops",
            });
        }

        if (enrollment.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                data: null,
                message: "This enrollment has already been processed",
            });
        }

        const updatedEnrollment = await prisma.workshopEnrollment.update({
            where: { id: enrollmentId },
            data: { status: "DENIED" },
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
                workshop: {
                    include: {
                        trainer: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(200).json({
            success: true,
            data: updatedEnrollment,
            message: "Enrollment denied",
        });
    } catch (error: any) {
        console.error("Error denying enrollment:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to deny enrollment",
        });
    }
};
// Get user's enrolled workshops
export const getUserEnrollments = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: userId } = req.user!;

        const enrollments = await prisma.workshopEnrollment.findMany({
            where: { userId },
            include: {
                workshop: {
                    include: {
                        trainer: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                        _count: {
                            select: {
                                enrollments: {
                                    where: { status: "APPROVED" },
                                },
                                videos: true,
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
            data: enrollments,
            message: "User enrollments fetched successfully",
        });
    } catch (error: any) {
        console.error("Error fetching user enrollments:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch user enrollments",
        });
    }
};

// Unenroll from workshop
export const unenrollFromWorkshop = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: workshopId } = req.params;
        const { id: userId } = req.user!;

        const enrollment = await prisma.workshopEnrollment.findUnique({
            where: {
                userId_workshopId: {
                    userId,
                    workshopId,
                },
            },
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Enrollment not found",
            });
        }

        await prisma.workshopEnrollment.delete({
            where: {
                id: enrollment.id,
            },
        });

        res.status(200).json({
            success: true,
            data: null,
            message: "Unenrolled successfully",
        });
    } catch (error: any) {
        console.error("Error unenrolling from workshop:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to unenroll from workshop",
        });
    }
};
