import axiosInstance from "./axiosConfig";

const BASE_URL = "/videos";

export const createVideo = async (data: FormData) => {
    try {
        const response = await axiosInstance.post(`${BASE_URL}`, data, {
            timeout: 5 * 60 * 1000, // 5 minutes
        });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "An error occurred",
            errors: error.response?.data?.errors,
        };
    }
};

export const deleteVideo = async (videoId: string) => {
    try {
        const response = await axiosInstance.delete(`${BASE_URL}/${videoId}`);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to delete video",
        };
    }
};

export const getVideos = async (workshopId: string) => {
    try {
        const response = await axiosInstance.get(`${BASE_URL}?workshopId=${workshopId}`);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "An error occurred",
        };
    }
};

export const updateVideoProgress = async (videoId: string, data: {
    watchedSeconds: number;
    totalDuration: number;
}) => {
    try {
        const response = await axiosInstance.post(`${BASE_URL}/${videoId}/progress`, data);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to update progress",
        };
    }
};

export const getVideoProgress = async (videoId: string) => {
    try {
        const response = await axiosInstance.get(`${BASE_URL}/${videoId}/progress`);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to get progress",
        };
    }
};

export const getContinueWatching = async (limit = 10) => {
    try {
        const response = await axiosInstance.get(`${BASE_URL}/my/continue-watching?limit=${limit}`);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to get continue watching",
        };
    }
};

export const markVideoComplete = async (videoId: string) => {
    try {
        const response = await axiosInstance.post(`${BASE_URL}/${videoId}/complete`);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to mark complete",
        };
    }
};

export const moveVideoToSection = async (videoId: string, sectionId: string | null) => {
    try {
        const response = await axiosInstance.patch(`${BASE_URL}/${videoId}/section`, { sectionId });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to update section",
        };
    }
};

export const uploadVideoPdf = async (videoId: string, file: File) => {
    try {
        const formData = new FormData();
        formData.append("pdf", file);
        const response = await axiosInstance.post(`${BASE_URL}/${videoId}/pdf`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to upload PDF",
        };
    }
};

export const deleteVideoPdf = async (videoId: string) => {
    try {
        const response = await axiosInstance.delete(`${BASE_URL}/${videoId}/pdf`);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to delete PDF",
        };
    }
};

