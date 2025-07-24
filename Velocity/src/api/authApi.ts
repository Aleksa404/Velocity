import axiosInstance from "./axiosConfig";
import type { ApiResponse, UserTokenResponse } from "../Types/Response";
import type { LoginUser, RegisterUser, User } from "../Types/User";
import { setAccessToken } from "../service/tokenService";
import { useUserStore } from "../stores/userStore";

export const signup = async (registerUser: RegisterUser) => {
  try {
    const response = await axiosInstance.post<ApiResponse<UserTokenResponse>>(
      "/auth/register",
      {
        firstName: registerUser.firstName,
        lastName: registerUser.lastName,
        email: registerUser.email,
        password: registerUser.password,
        confirmPassword: registerUser.confirmPassword,
      }
    );
    const data = response.data.data;
    if (!data) throw new Error("No data returned from server");

    const { user, accessToken } = data;
    setAccessToken(accessToken, user);
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
    const response = await axiosInstance.post<ApiResponse<UserTokenResponse>>(
      "/auth/login",
      {
        email: loginUser.email,
        password: loginUser.password,
      }
    );
    const data = response.data.data;
    if (!data) throw new Error("No data returned from server");
    const { user, accessToken } = data;
    setAccessToken(accessToken, user);
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

export const logout = async () => {
  try {
    await axiosInstance.post("/auth/logout");
    useUserStore.getState().logout();
  } catch (error) {
    throw error;
  }
};
