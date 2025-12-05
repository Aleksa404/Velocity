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

export const getVideos = async () => {
    try {
        const response = await axiosInstance.get("/videos");
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

export const getWatchHistory = async (limit = 20, offset = 0) => {
    try {
        const response = await axiosInstance.get(`/videos/my/watch-history?limit=${limit}&offset=${offset}`);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to get watch history",
        };
    }
};
