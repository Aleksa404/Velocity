import axiosInstance from "./axiosConfig";
import type { TrainerRequest } from "../Types/TrainerRequest";

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}
const BASE_URL = "/trainer-requests";

export const createTrainerRequest = async (message?: string) => {
    const response = await axiosInstance.post<ApiResponse<TrainerRequest>>(
        BASE_URL,
        { message }
    );
    return response.data;
};

export const getAllTrainerRequests = async () => {
    const response = await axiosInstance.get<ApiResponse<TrainerRequest[]>>(
        BASE_URL
    );
    return response.data;
};

export const getPendingTrainerRequests = async () => {
    const response = await axiosInstance.get<ApiResponse<TrainerRequest[]>>(
        `${BASE_URL}/pending`
    );
    return response.data;
};

export const approveTrainerRequest = async (requestId: string) => {
    const response = await axiosInstance.patch<ApiResponse<TrainerRequest>>(
        `${BASE_URL}/${requestId}/approve`
    );
    return response.data;
};

export const denyTrainerRequest = async (requestId: string) => {
    const response = await axiosInstance.patch<ApiResponse<TrainerRequest>>(
        `${BASE_URL}/${requestId}/deny`
    );
    return response.data;
};

// User submited requests
export const getUserTrainerRequest = async () => {
    const response = await axiosInstance.get<ApiResponse<TrainerRequest | null>>(
        `${BASE_URL}/my-request`
    );
    return response.data;
};
