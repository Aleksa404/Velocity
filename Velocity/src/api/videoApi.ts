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
