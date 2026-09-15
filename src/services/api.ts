import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

const ACCESS_TOKEN_KEY = "accessToken";
const AUTH_PATH_SEGMENT = "/auth/";

export const getAccessToken = (): string | null =>
  localStorage.getItem(ACCESS_TOKEN_KEY);

export const setAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearAccessToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isAuthEndpoint = (error.config?.url ?? "").includes(
      AUTH_PATH_SEGMENT,
    );

    if (error.response?.status === 401 && !isAuthEndpoint) {
      clearAccessToken();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
