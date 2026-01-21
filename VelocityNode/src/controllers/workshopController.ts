import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiResponse } from "../types/ApiResponse";
import { videoUploadQueue } from "../YoutubeUploadMQ/videoQueue";

const prisma = new PrismaClient();


export const createWorkshop = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const user = req.user;
        if (!user) { return res.status(401).json({ success: false, data: null, message: "Unauthorized" }) }
        const { id: trainerId, role } = user;
        const { title, description } = req.body;

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


export const getAllWorkshops = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const currentUserId = req.user?.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string || "";
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

        // Build where clause with optional search
        const whereClause: any = {
            trainerId: { in: followedTrainerIds },
        };

        if (search.trim()) {
            whereClause.title = {
                contains: search.trim(),
                mode: "insensitive",
            };
        }

        const [workshops, total] = await Promise.all([
            prisma.workshop.findMany({
                where: whereClause,
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
                    enrollments: {
                        where: { userId: currentUserId },
                        select: { status: true }
                    },
                    videos: {
                        include: {
                            watchProgress: {
                                where: { userId: currentUserId },
                            },
                        },
                    },
                    _count: {
                        select: {
                            enrollments: {
                                where: { status: "APPROVED" },
                            },
                            videos: true,
                            sections: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma.workshop.count({
                where: whereClause,
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        // check enrollment status for each workshop
        const workshopsWithStatus = workshops.map(w => ({
            ...w,
            enrollmentStatus: w.enrollments[0]?.status || null,
        }));


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
                enrollments: currentUserId
                    ? {
                        where: { userId: currentUserId },
                        select: { status: true }
                    }
                    : false,
                sections: {
                    orderBy: { order: "asc" },
                    include: {
                        videos: {
                            orderBy: { uploadedAt: "asc" },
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
                            }
                        }
                    }
                },
                videos: {
                    where: { sectionId: null },
                    orderBy: { uploadedAt: "asc" },
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
        const enrollmentStatus =
            workshop.enrollments?.[0]?.status || null;

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


export const updateWorkshop = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id } = req.params;
        const { id: userId } = req.user!;
        const { title, description } = req.body;

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

        const videos = await prisma.video.findMany({
            where: { workshopId: id },
        });

        // Queue delete jobs for each video
        for (const video of videos) {
            try {
                await videoUploadQueue.add("video-delete", {
                    type: "delete",
                    videoUrl: video.url,
                    storageType: video.storageType as any,
                    userId
                });
                console.log(`Queued ${video.storageType} delete for video: ${video.id}`);
            } catch (err) {
                console.error(`Failed to queue delete for video ${video.id}:`, err);
            }
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

export const enrollInWorkshop = async (
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
                                sections: true,
                            },
                        },
                        videos: {
                            include: {
                                watchProgress: {
                                    where: { userId },
                                },
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

        // Delete all video watch progress for this workshop
        await prisma.videoWatchProgress.deleteMany({
            where: {
                userId,
                video: {
                    workshopId,
                },
            },
        });

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

export const createSection = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: workshopId } = req.params;
        const { id: userId } = req.user!;
        const { title } = req.body;

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
            return res.status(403).json({
                success: false,
                data: null,
                message: "You can only add sections to your own workshops",
            });
        }

        // Get max order
        const lastSection = await prisma.workshopSection.findFirst({
            where: { workshopId },
            orderBy: { order: "desc" },
        });
        const newOrder = lastSection ? lastSection.order + 1 : 0;

        const section = await prisma.workshopSection.create({
            data: {
                title,
                workshopId,
                order: newOrder,
            },
        });

        res.status(201).json({
            success: true,
            data: section,
            message: "Section created successfully",
        });
    } catch (error: any) {
        console.error("Error creating section:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to create section",
        });
    }
};

export const updateSection = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: sectionId } = req.params;
        const { id: userId } = req.user!;
        const { title } = req.body;

        const section = await prisma.workshopSection.findUnique({
            where: { id: sectionId },
            include: { workshop: true },
        });

        if (!section) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Section not found",
            });
        }

        if (section.workshop.trainerId !== userId) {
            return res.status(403).json({
                success: false,
                data: null,
                message: "You can only update sections in your own workshops",
            });
        }

        const updatedSection = await prisma.workshopSection.update({
            where: { id: sectionId },
            data: { title },
        });

        res.status(200).json({
            success: true,
            data: updatedSection,
            message: "Section updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating section:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to update section",
        });
    }
};

export const deleteSection = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: sectionId } = req.params;
        const { id: userId } = req.user!;

        const section = await prisma.workshopSection.findUnique({
            where: { id: sectionId },
            include: { workshop: true },
        });

        if (!section) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Section not found",
            });
        }

        if (section.workshop.trainerId !== userId) {
            return res.status(403).json({
                success: false,
                data: null,
                message: "You can only delete sections in your own workshops",
            });
        }

        // Move videos to null section before deleting
        await prisma.video.updateMany({
            where: { sectionId },
            data: { sectionId: null },
        });

        await prisma.workshopSection.delete({
            where: { id: sectionId },
        });

        res.status(200).json({
            success: true,
            data: null,
            message: "Section deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting section:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to delete section",
        });
    }
};

export const reorderSections = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: workshopId } = req.params;
        const { id: userId } = req.user!;
        const { sections } = req.body; // Array of { id, order }

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
            return res.status(403).json({
                success: false,
                data: null,
                message: "You can only reorder sections in your own workshops",
            });
        }

        // Transaction to update all
        await prisma.$transaction(
            sections.map((s: { id: string; order: number }) =>
                prisma.workshopSection.update({
                    where: { id: s.id },
                    data: { order: s.order },
                })
            )
        );

        res.status(200).json({
            success: true,
            data: null,
            message: "Sections reordered successfully",
        });
    } catch (error: any) {
        console.error("Error reordering sections:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to reorder sections",
        });
    }
};



export const getMyWorkshops = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id: trainerId, role } = req.user!;

        if (role !== "TRAINER" && role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                data: null,
                message: "Only trainers can access their workshops",
            });
        }

        const workshops = await prisma.workshop.findMany({
            where: { trainerId },
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
                        sections: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json({
            success: true,
            data: workshops,
            message: "Your workshops fetched successfully",
        });
    } catch (error: any) {
        console.error("Error fetching trainer workshops:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch your workshops",
        });
    }
};

export const getTrainerPendingEnrollments = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {

        const { id: trainerId } = req.user!;

        const workshops = await prisma.workshop.findMany({
            where: { trainerId },
            include: {
                enrollments: {
                    where: { status: "PENDING" },
                    include: {
                        user: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });

        // Only return workshops that have pending enrollments
        const workshopsWithPending = workshops.filter(
            (workshop) => workshop.enrollments.length > 0
        );

        res.status(200).json({
            success: true,
            data: workshopsWithPending,
            message: "Pending enrollments fetched successfully",
        });
    } catch (error: any) {
        console.error("Error fetching trainer pending enrollments:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to fetch pending enrollments",
        });
    }
};

export const uploadWorkshopImage = async (
    req: Request,
    res: Response<ApiResponse<any>>
) => {
    try {
        const { id } = req.params;
        const workshopId = id.trim();
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
            return res.status(403).json({
                success: false,
                data: null,
                message: "You can only upload images to your own workshops",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "No image file provided",
            });
        }

        // Construct the URL path for the uploaded image
        const imageUrl = `/uploads/workshop-images/${req.file.filename}`;

        const updatedWorkshop = await prisma.workshop.update({
            where: { id: workshopId },
            data: { imageUrl },
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
            message: "Workshop image uploaded successfully",
        });
    } catch (error: any) {
        console.error("Error uploading workshop image:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: error.message || "Failed to upload workshop image",
        });
    }
};
