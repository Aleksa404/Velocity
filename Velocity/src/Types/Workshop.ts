export interface Workshop {
    id: string;
    title: string;
    description: string;
    date: string;
    capacity?: number | null;
    createdAt: string;
    updatedAt: string;
    trainerId: string;
    trainer?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
    };
    videos?: Video[];
    _count?: {
        enrollments: number;
        videos: number;
    };
    enrollmentStatus?: string | null;
}

export interface Video {
    id: string;
    title: string;
    url: string;
    uploadedAt: string;
    trainerId: string;
    workshopId?: string | null;
}

export interface WorkshopEnrollment {
    id: string;
    userId: string;
    workshopId: string;
    status: "PENDING" | "APPROVED" | "DENIED";
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
    };
    workshop?: Workshop;
}
