import axiosInstance from "./axiosConfig";
import type { TrainerRequest } from "../Types/TrainerRequest";

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export const createTrainerRequest = async (message?: string) => {
    const response = await axiosInstance.post<ApiResponse<TrainerRequest>>(
        "/trainer-requests",
        { message }
    );
    return response.data;
};

export const getAllTrainerRequests = async () => {
    const response = await axiosInstance.get<ApiResponse<TrainerRequest[]>>(
        "/trainer-requests"
    );
    return response.data;
};

export const getPendingTrainerRequests = async () => {
    const response = await axiosInstance.get<ApiResponse<TrainerRequest[]>>(
        "/trainer-requests/pending"
    );
    return response.data;
};

export const approveTrainerRequest = async (requestId: string) => {
    const response = await axiosInstance.patch<ApiResponse<TrainerRequest>>(
        `/trainer-requests/${requestId}/approve`
    );
    return response.data;
};

export const denyTrainerRequest = async (requestId: string) => {
    const response = await axiosInstance.patch<ApiResponse<TrainerRequest>>(
        `/trainer-requests/${requestId}/deny`
    );
    return response.data;
};

export const getUserTrainerRequest = async () => {
    const response = await axiosInstance.get<ApiResponse<TrainerRequest | null>>(
        "/trainer-requests/my-request"
    );
    return response.data;
};
