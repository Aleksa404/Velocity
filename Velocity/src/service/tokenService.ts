import axiosInstance from "../api/axiosConfig";
import type { User } from "../Types/User";
import { useUserStore } from "../stores/userStore";

let accessToken: string | null = localStorage.getItem("accessToken");

export const setAccessToken = (token: string, user?: User): void => {
  accessToken = token;
  localStorage.setItem("accessToken", token);
  if (axiosInstance.defaults.headers.common) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  if (user) {
    useUserStore.getState().setUser(user);
  }

};

export const clearAuthData = (): void => {
  accessToken = null;
  localStorage.removeItem("accessToken");
  if (axiosInstance.defaults.headers.common) {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
};

export const getAccessToken = (): string | null => {
  return accessToken;
};
