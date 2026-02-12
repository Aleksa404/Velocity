import axiosInstance from "./axiosConfig";
import type { ApiResponse, UserTokenResponse } from "../Types/Response";
import type { LoginUser, RegisterUser } from "../Types/User";
import { setAccessToken } from "../service/tokenService";
import { useUserStore } from "../stores/userStore";


const BASE_URL = "/auth";

export const signup = async (registerUser: RegisterUser) => {
  try {
    const response = await axiosInstance.post<ApiResponse<UserTokenResponse>>(
      `${BASE_URL}/register`,
      {
        firstName: registerUser.firstName,
        lastName: registerUser.lastName,
        email: registerUser.email,
        password: registerUser.password,
        confirmPassword: registerUser.confirmPassword,
        captchaToken: registerUser.captchaToken,
      }
    );
    const data = response.data.data;
    if (!data) throw new Error("No data returned from server");

    const { user, accessToken } = data;
    setAccessToken(accessToken, user);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      return {
        success: false,
        message: error.response.data?.message,
        data: null,
      };
    }
    throw error;
  }
};

export const login = async (loginUser: LoginUser) => {
  try {
    const response = await axiosInstance.post<ApiResponse<UserTokenResponse>>(
      `${BASE_URL}/login`,
      {
        email: loginUser.email,
        password: loginUser.password,
      }
    );
    const data = response.data.data;
    if (!data) throw new Error("No data returned from server");
    const { user, accessToken } = data;
    setAccessToken(accessToken, user);
    return response.data;

  } catch (error: any) {
    if (error.response?.status === 400) {
      return {
        success: false,
        message: error.response.data?.message,
        data: null,
      };
    }

    throw error;
  }
};

export const logout = async () => {

  await axiosInstance.post(`${BASE_URL}/logout`);
  useUserStore.getState().logout();

};
