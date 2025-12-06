import axiosInstance from "./axiosConfig";

export const createVideo = async (data: FormData) => {
    try {
        const response = await axiosInstance.post("/videos", data);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "An error occurred",
            errors: error.response?.data?.errors,
        };
    }
};

// Video deletion
export const deleteVideo = async (videoId: string) => {
    try {
        const response = await axiosInstance.delete(`/videos/${videoId}`);
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
        const response = await axiosInstance.get(`/videos?workshopId=${workshopId}`);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "An error occurred",
        };
    }
};

// Video progress tracking
export const updateVideoProgress = async (videoId: string, data: {
    watchedSeconds: number;
    totalDuration: number;
}) => {
    try {
        const response = await axiosInstance.post(`/videos/${videoId}/progress`, data);
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
        const response = await axiosInstance.get(`/videos/${videoId}/progress`);
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
        const response = await axiosInstance.get(`/videos/my/continue-watching?limit=${limit}`);
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
        const response = await axiosInstance.post(`/videos/${videoId}/complete`);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to mark complete",
        };
    }
};

