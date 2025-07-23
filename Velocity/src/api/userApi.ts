import type { ApiResponse } from "../Types/Response";
import axiosInstance from "./axiosConfig";
import type { User } from "../Types/User";

export const getUserRole = async (userId: string) => {
  console.log("Fetching user role for ID:", userId);
  try {
    const response = await axiosInstance.get<ApiResponse<string>>(
      `/users/role/${userId}`
    );
    console.log("User role fetched:", response.data);
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch user role");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching user role:", error);
    throw error;
  }
};
export const updateUserRole = async (userId: string, role: string) => {
  try {
    const response = await axiosInstance.patch<ApiResponse<User>>(
      `/users/role/${userId}`,
      { role }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};
