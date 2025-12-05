import axiosInstance from "./axiosConfig";
import type { TrainerRequest } from "../Types/TrainerRequest";

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

// Create a trainer request
export const createTrainerRequest = async (message?: string) => {
    const response = await axiosInstance.post<ApiResponse<TrainerRequest>>(
        "/trainer-requests",
        { message }
    );
    return response.data;
};

// Get all trainer requests (admin only)
export const getAllTrainerRequests = async () => {
    const response = await axiosInstance.get<ApiResponse<TrainerRequest[]>>(
        "/trainer-requests"
    );
    return response.data;
};

// Get pending trainer requests (admin only)
export const getPendingTrainerRequests = async () => {
    const response = await axiosInstance.get<ApiResponse<TrainerRequest[]>>(
        "/trainer-requests/pending"
    );
    return response.data;
};

// Approve a trainer request (admin only)
export const approveTrainerRequest = async (requestId: string) => {
    const response = await axiosInstance.patch<ApiResponse<TrainerRequest>>(
        `/trainer-requests/${requestId}/approve`
    );
    return response.data;
};

// Deny a trainer request (admin only)
export const denyTrainerRequest = async (requestId: string) => {
    const response = await axiosInstance.patch<ApiResponse<TrainerRequest>>(
        `/trainer-requests/${requestId}/deny`
    );
    return response.data;
};

// Get current user's trainer request
export const getUserTrainerRequest = async () => {
    const response = await axiosInstance.get<ApiResponse<TrainerRequest | null>>(
        "/trainer-requests/my-request"
    );
    return response.data;
};
