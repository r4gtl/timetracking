import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

const TOKEN_ENDPOINTS = ["/token/", "/token/refresh/"];

function isTokenEndpoint(url?: string): boolean {
  if (!url) return false;
  return TOKEN_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

function clearSession(): void {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

apiClient.interceptors.request.use((config) => {
  const access = localStorage.getItem("access");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isTokenEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    const refresh = localStorage.getItem("refresh");
    if (!refresh) {
      clearSession();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const { data } = await axios.post<{ access: string }>(
        `${baseURL}/token/refresh/`,
        { refresh },
      );
      localStorage.setItem("access", data.access);
      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearSession();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  },
);

export interface TokenPair {
  access: string;
  refresh: string;
}

export async function loginRequest(
  username: string,
  password: string,
): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>("/token/", {
    username,
    password,
  });
  return data;
}

export function logoutRequest(): void {
  clearSession();
}
