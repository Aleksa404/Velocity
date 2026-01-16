import type { Video } from "./Video";

export interface WorkshopSection {
    id: string;
    title: string;
    order: number;
    workshopId: string;
    videos?: Video[];
}


export interface Workshop {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
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
    sections?: WorkshopSection[];
    _count?: {
        enrollments: number;
        videos: number;
        sections: number;
    };
    enrollmentStatus?: string | null;
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
