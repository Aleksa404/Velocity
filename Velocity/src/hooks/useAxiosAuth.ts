import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

export const useAxiosAuth = (): typeof axiosInstance => {
  const { getToken } = useAuth();

  useEffect(() => {
    // console.log("Setting up Axios request interceptor");
    // const requestInterceptor = axiosInstance.interceptors.request.use(
    //   async (config) => {
    //     const token = await getToken();
    //     if (token) {
    //       config.headers.Authorization = `Bearer ${token}`;
    //     }
    //     return config;
    //   },
    //   (error) => Promise.reject(error)
    // );
    // return () => {
    //   axiosInstance.interceptors.request.eject(requestInterceptor);
    // };
  }, [getToken]);

  return axiosInstance;
};
