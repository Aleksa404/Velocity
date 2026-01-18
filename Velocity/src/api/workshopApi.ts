import axiosInstance from "./axiosConfig";
import type { Workshop, WorkshopEnrollment } from "../Types/Workshop";

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

const BASE_URL = "/workshops";

export const getAllWorkshops = async (page = 1, limit = 20, search = "") => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search.trim()) {
        params.append("search", search.trim());
    }
    const response = await axiosInstance.get<ApiResponse<Workshop[]>>(`${BASE_URL}?${params.toString()}`);
    return response.data;
};

export const getMyWorkshops = async () => {
    const response = await axiosInstance.get<ApiResponse<Workshop[]>>(`${BASE_URL}/my`);
    return response.data;
};

export const getWorkshopById = async (workshopId: string) => {
    const response = await axiosInstance.get<ApiResponse<Workshop>>(`${BASE_URL}/${workshopId}`);
    return response.data;
};

export const createWorkshop = async (workshopData: {
    title: string;
    description: string;
}) => {
    const response = await axiosInstance.post<ApiResponse<Workshop>>(`${BASE_URL}`, workshopData);
    return response.data;
};

export const updateWorkshop = async (workshopId: string, workshopData: Partial<{
    title: string;
    description: string;
}>) => {
    const response = await axiosInstance.patch<ApiResponse<Workshop>>(`${BASE_URL}/${workshopId}`, workshopData);
    return response.data;
};

export const deleteWorkshop = async (workshopId: string) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(`${BASE_URL}/${workshopId}`);
    return response.data;
};

export const enrollInWorkshop = async (workshopId: string) => {
    const response = await axiosInstance.post<ApiResponse<WorkshopEnrollment>>(`${BASE_URL}/${workshopId}/enroll`);
    return response.data;
};

export const getWorkshopEnrollments = async (workshopId: string) => {
    const response = await axiosInstance.get<ApiResponse<WorkshopEnrollment[]>>(`${BASE_URL}/${workshopId}/enrollments`);
    return response.data;
};

export const approveEnrollment = async (enrollmentId: string) => {
    const response = await axiosInstance.patch<ApiResponse<WorkshopEnrollment>>(`${BASE_URL}/enrollments/${enrollmentId}/approve`);
    return response.data;
};

export const denyEnrollment = async (enrollmentId: string) => {
    const response = await axiosInstance.patch<ApiResponse<WorkshopEnrollment>>(`${BASE_URL}/enrollments/${enrollmentId}/deny`);
    return response.data;
};

export const getUserEnrollments = async () => {
    const response = await axiosInstance.get<ApiResponse<WorkshopEnrollment[]>>(`${BASE_URL}/my/enrollments`);
    return response.data;
};

export const unenrollFromWorkshop = async (workshopId: string) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(`${BASE_URL}/${workshopId}/enroll`);
    return response.data;
};

// Section Management
export const createSection = async (workshopId: string, sectionData: { title: string }) => {
    const response = await axiosInstance.post<ApiResponse<any>>(`${BASE_URL}/${workshopId}/sections`, sectionData);
    return response.data;
};

export const updateSection = async (sectionId: string, sectionData: { title: string }) => {
    const response = await axiosInstance.patch<ApiResponse<any>>(`${BASE_URL}/sections/${sectionId}`, sectionData);
    return response.data;
};

export const deleteSection = async (sectionId: string) => {
    const response = await axiosInstance.delete<ApiResponse<any>>(`${BASE_URL}/sections/${sectionId}`);
    return response.data;
};

export const reorderSections = async (workshopId: string, sectionIds: string[]) => {
    const response = await axiosInstance.post<ApiResponse<any>>(`${BASE_URL}/${workshopId}/sections/reorder`, { sectionIds });
    return response.data;
};



// Workshop Image Upload
export const uploadWorkshopImage = async (workshopId: string, imageFile: File) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await axiosInstance.post<ApiResponse<Workshop>>(
        `${BASE_URL}/${workshopId}/image`,
        formData
    );
    return response.data;
};
