import type { ApiResponse } from "../Types/Response";
import axiosInstance from "./axiosConfig";


const BASE_URL = "/users";

export interface UserForAdmin {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "USER" | "TRAINER" | "ADMIN";
  createdAt: string;
}

export interface UsersResponse {
  users: UserForAdmin[];
  total: number;
  page: number;
  totalPages: number;
}

export const getAllUsers = async (page = 1, limit = 10, search = "") => {
  try {
    const response = await axiosInstance.get<ApiResponse<UsersResponse>>(BASE_URL, {
      params: { page, limit, search },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// export const getUserRole = async (userId: string) => {
//   console.log("Fetching user role for ID:", userId);
//   try {
//     const response = await axiosInstance.get<ApiResponse<string>>(
//       `${BASE_URL}/role/${userId}`
//     );
//     console.log("User role fetched:", response.data);
//     if (!response.data.success) {
//       throw new Error(response.data.message || "Failed to fetch user role");
//     }
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching user role:", error);
//     throw error;
//   }
// };
export const updateUserRole = async (userId: string, role: string) => {
  try {
    const response = await axiosInstance.patch<ApiResponse<null>>(
      `${BASE_URL}/role/${userId}`,
      { role }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const response = await axiosInstance.delete<ApiResponse<null>>(`${BASE_URL}/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
