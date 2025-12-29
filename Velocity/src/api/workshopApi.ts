import axiosInstance from "./axiosConfig";
import type { Workshop, WorkshopEnrollment } from "../Types/Workshop";

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export const getAllWorkshops = async (page = 1, limit = 20, search = "") => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search.trim()) {
        params.append("search", search.trim());
    }
    const response = await axiosInstance.get<ApiResponse<Workshop[]>>(`/workshops?${params.toString()}`);
    return response.data;
};

export const getMyWorkshops = async () => {
    const response = await axiosInstance.get<ApiResponse<Workshop[]>>("/workshops/my");
    return response.data;
};

export const getWorkshopById = async (workshopId: string) => {
    const response = await axiosInstance.get<ApiResponse<Workshop>>(`/workshops/${workshopId}`);
    return response.data;
};

export const createWorkshop = async (workshopData: {
    title: string;
    description: string;
}) => {
    const response = await axiosInstance.post<ApiResponse<Workshop>>("/workshops", workshopData);
    return response.data;
};

export const updateWorkshop = async (workshopId: string, workshopData: Partial<{
    title: string;
    description: string;
}>) => {
    const response = await axiosInstance.patch<ApiResponse<Workshop>>(`/workshops/${workshopId}`, workshopData);
    return response.data;
};

export const deleteWorkshop = async (workshopId: string) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(`/workshops/${workshopId}`);
    return response.data;
};

export const enrollInWorkshop = async (workshopId: string) => {
    const response = await axiosInstance.post<ApiResponse<WorkshopEnrollment>>(`/workshops/${workshopId}/enroll`);
    return response.data;
};

export const getWorkshopEnrollments = async (workshopId: string) => {
    const response = await axiosInstance.get<ApiResponse<WorkshopEnrollment[]>>(`/workshops/${workshopId}/enrollments`);
    return response.data;
};

export const approveEnrollment = async (enrollmentId: string) => {
    const response = await axiosInstance.patch<ApiResponse<WorkshopEnrollment>>(`/workshops/enrollments/${enrollmentId}/approve`);
    return response.data;
};

export const denyEnrollment = async (enrollmentId: string) => {
    const response = await axiosInstance.patch<ApiResponse<WorkshopEnrollment>>(`/workshops/enrollments/${enrollmentId}/deny`);
    return response.data;
};

export const getUserEnrollments = async () => {
    const response = await axiosInstance.get<ApiResponse<WorkshopEnrollment[]>>("/workshops/my/enrollments");
    return response.data;
};

export const unenrollFromWorkshop = async (workshopId: string) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(`/workshops/${workshopId}/enroll`);
    return response.data;
};
