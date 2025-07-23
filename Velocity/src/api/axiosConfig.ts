import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { User } from "../Types/User";
import { useUserStore } from "../stores/userStore";

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

interface RefreshTokenResponse {
  accessToken: string;
  user: User;
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}
// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string, // Your backend URL
  withCredentials: true, // Important: This sends cookies with requests
  timeout: 10000,
});

// Token management
let accessToken: string | null = localStorage.getItem("accessToken");
let isRefreshing: boolean = false;
let failedQueue: QueuedRequest[] = [];

// Helper function to process queued requests
const processQueue = (error: any, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

// Request interceptor - Add access token to headers
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
axiosInstance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  async (error: AxiosError): Promise<any> => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    //disable retry for auth logic
    const isAuthRoute =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh");

    // If error is 401 and we haven't already tried to refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      if (isRefreshing) {
        // If refresh is already in progress, queue this request
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err: any) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        const url = import.meta.env.VITE_API_URL as string;
        const response = await axios.post<RefreshTokenResponse>(
          `${url}/auth/refresh`,
          {}, // Empty body since refresh token is in cookie
          { withCredentials: true }
        );

        const { accessToken: newAccessToken, user } = response.data;

        if (!newAccessToken || typeof newAccessToken !== "string") {
          throw new Error(
            "Invalid access token received from refresh endpoint"
          );
        }

        // Update stored token
        accessToken = newAccessToken;
        localStorage.setItem("accessToken", newAccessToken);

        if (user) {
          useUserStore.getState().setUser(user);
        }

        // Update default header for future requests
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        // Process all queued requests with new token
        processQueue(null, newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        processQueue(refreshError, null);

        // Clear stored token
        accessToken = null;
        localStorage.removeItem("accessToken");
        if (axiosInstance.defaults.headers.common) {
          delete axiosInstance.defaults.headers.common["Authorization"];
        }
        useUserStore.getState().logout();

        // Redirect to login page
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
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

export default axiosInstance;
