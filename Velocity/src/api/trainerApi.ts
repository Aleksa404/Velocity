import axiosInstance from "./axiosConfig";
import type { Trainer, Follow } from "../Types/Trainer";

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export const getAllTrainers = async (page: number = 1, limit: number = 12) => {
    const response = await axiosInstance.get<ApiResponse<{
        trainers: Trainer[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
    }>>("/trainers", {
        params: { page, limit },
    });
    return response.data;
};

export const searchTrainers = async (query: string) => {
    const response = await axiosInstance.get<ApiResponse<Trainer[]>>(`/trainers/search`, {
        params: { query },
    });
    return response.data;
};

export const getTrainerProfile = async (trainerId: string) => {
    const response = await axiosInstance.get<ApiResponse<Trainer>>(`/trainers/${trainerId}`);
    return response.data;
};

export const followTrainer = async (trainerId: string) => {
    const response = await axiosInstance.post<ApiResponse<Follow>>(`/trainers/${trainerId}/follow`);
    return response.data;
};

export const unfollowTrainer = async (trainerId: string) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(`/trainers/${trainerId}/follow`);
    return response.data;
};

// Get trainers the current user is following
export const getFollowing = async () => {
    const response = await axiosInstance.get<ApiResponse<Follow[]>>("/trainers/me/following");
    return response.data;
};

// Get followers of a trainer
export const getFollowers = async (trainerId: string) => {
    const response = await axiosInstance.get<ApiResponse<Follow[]>>(`/trainers/${trainerId}/followers`);
    return response.data;
};
