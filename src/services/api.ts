import axios from "axios";
import { env } from "@/config/env";

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl || undefined,
  timeout: 12000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const sessionToken = window.sessionStorage.getItem("clinic-staff-jwt");

  if (sessionToken) {
    config.headers.Authorization = `Bearer ${sessionToken}`;
  }

  config.headers["x-clinic-demo-mode"] = "prototype";

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const message =
        typeof error.response?.data === "object" &&
        error.response?.data &&
        "message" in error.response.data
          ? String(error.response.data.message)
          : error.message;

      return Promise.reject(new Error(message));
    }

    return Promise.reject(error);
  },
);
