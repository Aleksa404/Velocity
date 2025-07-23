import axiosInstance from "./axiosConfig";
import type { ApiResponse } from "../Types/Response";
import type { LoginUser, RegisterUser, User } from "../Types/User";
import { setAccessToken } from "../service/tokenService";

export const signup = async (registerUser: RegisterUser) => {
  try {
    const response = await axiosInstance.post<
      ApiResponse<{ user: User; accessToken: string }>
    >("/auth/register", {
      firstName: registerUser.firstName,
      lastName: registerUser.lastName,
      email: registerUser.email,
      password: registerUser.password,
      confirmPassword: registerUser.confirmPassword,
    });
    const data = response.data.data;
    if (!data) throw new Error("No data returned from server");

    const { user, accessToken: token } = data;
    setAccessToken(token, user);
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

export const login = async (loginUser: LoginUser) => {
  try {
    const response = await axiosInstance.post<
      ApiResponse<{ user: User; accessToken: string }>
    >("/auth/login", {
      email: loginUser.email,
      password: loginUser.password,
    });
    const data = response.data.data;
    if (!data) throw new Error("No data returned from server");
    const { user, accessToken: token } = data;
    setAccessToken(token, user);
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
