import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (!original) {
      return Promise.reject(error);
    }
    const status = error.response?.status;
    const url = original.url ?? "";
    const isAuthRefresh = url.includes("/auth/refresh");
    const isAuthLogin = url.includes("/auth/login");
    if (
      status === 401 &&
      !original._retry &&
      !isAuthRefresh &&
      !isAuthLogin
    ) {
      original._retry = true;
      try {
        await api.post("/auth/refresh");
        return api(original);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
