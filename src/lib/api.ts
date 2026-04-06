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

/**
 * Nest + Zod cần @Body() là object. Một số trường hợp (retry 401, edge axios)
 * khiến `data` là chuỗi JSON — server parse ra string → lỗi "expected object, received string".
 */
function normalizeJsonBody(data: unknown): unknown {
  if (data == null || typeof data !== "string") {
    return data;
  }
  try {
    let parsed: unknown = JSON.parse(data);
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return data;
      }
    }
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed;
    }
  } catch {
    return data;
  }
  return data;
}

api.interceptors.request.use((config) => {
  const ct =
    (config.headers &&
      (config.headers["Content-Type"] ?? config.headers["content-type"])) ??
    "";
  if (typeof ct === "string" && ct.includes("application/json")) {
    config.data = normalizeJsonBody(config.data);
  }
  return config;
});

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
        const retryCfg = { ...original } as InternalAxiosRequestConfig;
        retryCfg.data = normalizeJsonBody(retryCfg.data);
        return api.request(retryCfg);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
