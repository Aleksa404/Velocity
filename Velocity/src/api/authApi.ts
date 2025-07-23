import axiosInstance from "./axiosInstance";

import type { ApiResponse } from "../Types/Response";
import type { RegisterUser } from "../Types/User";

export const signup = async (registerUser: RegisterUser) => {
  try {
    const response = await axiosInstance.post<ApiResponse<string>>(
      "/auth/register",
      {
        firstName: registerUser.firstName,
        lastName: registerUser.lastName,
        email: registerUser.email,
        password: registerUser.password,
        confirmPassword: registerUser.confirmPassword,
      }
    );
    console.log(response + "de");
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      // Return the error response data instead of throwing
      return {
        success: false,
        message: error.response.data?.message || "Validation error",
        data: null,
      };
    }

    // For other errors (network, 500, etc.), still throw
    throw error;
  }
};
