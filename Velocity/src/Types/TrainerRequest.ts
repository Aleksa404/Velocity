export type RequestStatus = "PENDING" | "APPROVED" | "DENIED";

export interface TrainerRequest {
    id: string;
    userId: string;
    status: RequestStatus;
    message?: string;
    createdAt: Date;
    updatedAt: Date;
    user?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
    };
}
