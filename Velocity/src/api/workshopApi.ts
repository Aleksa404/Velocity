import axiosInstance from "./axiosConfig";
import type { Workshop, WorkshopEnrollment } from "../Types/Workshop";

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

// Get all workshops
export const getAllWorkshops = async (page = 1, limit = 20) => {
    const response = await axiosInstance.get<ApiResponse<Workshop[]>>(`/workshops?page=${page}&limit=${limit}`);
    return response.data;
};

// Get workshop by ID
export const getWorkshopById = async (workshopId: string) => {
    const response = await axiosInstance.get<ApiResponse<Workshop>>(`/workshops/${workshopId}`);
    return response.data;
};

// Create a workshop (trainers only)
export const createWorkshop = async (workshopData: {
    title: string;
    description: string;
    date: string;
    capacity?: number;
}) => {
    const response = await axiosInstance.post<ApiResponse<Workshop>>("/workshops", workshopData);
    return response.data;
};

// Update a workshop
export const updateWorkshop = async (workshopId: string, workshopData: Partial<{
    title: string;
    description: string;
    date: string;
    capacity?: number | null;
}>) => {
    const response = await axiosInstance.patch<ApiResponse<Workshop>>(`/workshops/${workshopId}`, workshopData);
    return response.data;
};

// Delete a workshop
export const deleteWorkshop = async (workshopId: string) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(`/workshops/${workshopId}`);
    return response.data;
};

// Enroll in a workshop
export const enrollInWorkshop = async (workshopId: string) => {
    const response = await axiosInstance.post<ApiResponse<WorkshopEnrollment>>(`/workshops/${workshopId}/enroll`);
    return response.data;
};

// Get workshop enrollments (trainer only)
export const getWorkshopEnrollments = async (workshopId: string) => {
    const response = await axiosInstance.get<ApiResponse<WorkshopEnrollment[]>>(`/workshops/${workshopId}/enrollments`);
    return response.data;
};

// Approve an enrollment
export const approveEnrollment = async (enrollmentId: string) => {
    const response = await axiosInstance.patch<ApiResponse<WorkshopEnrollment>>(`/workshops/enrollments/${enrollmentId}/approve`);
    return response.data;
};

// Deny an enrollment
export const denyEnrollment = async (enrollmentId: string) => {
    const response = await axiosInstance.patch<ApiResponse<WorkshopEnrollment>>(`/workshops/enrollments/${enrollmentId}/deny`);
    return response.data;
};

// Get user's enrolled workshops
export const getUserEnrollments = async () => {
    const response = await axiosInstance.get<ApiResponse<WorkshopEnrollment[]>>("/workshops/my/enrollments");
    return response.data;
};

// Unenroll from a workshop
export const unenrollFromWorkshop = async (workshopId: string) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(`/workshops/${workshopId}/enroll`);
    return response.data;
};
