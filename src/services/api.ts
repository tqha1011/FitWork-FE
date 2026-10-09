import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { TokenResponse } from "../types/auth.ts";
import {
  canRefreshSession,
  clearAccessToken,
  getAccessToken,
  getAuthSession,
  getSessionGeneration,
  setAuthSession,
} from "./authSession.ts";
export { clearAccessToken, getAccessToken } from "./authSession.ts";
type SessionRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
  _sessionGeneration?: number;
};

export const api = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000/api",
  withCredentials: true,
  timeout: 15000,
});

function isAuthEndpoint(url = ""): boolean {
  return /\/auth\/(?:register|login|refresh|logout)(?:[/?#]|$)/.test(url);
}
let refreshFlight: Promise<TokenResponse> | null = null;
export function refreshAccessToken(): Promise<TokenResponse> {
  if (refreshFlight) return refreshFlight;
  if (!canRefreshSession())
    return Promise.reject(new Error("Please sign in again."));
  const generation = getSessionGeneration();
  refreshFlight = api
    .post<TokenResponse>("/auth/refresh")
    .then(({ data }) => {
      setAuthSession(data, generation);
      return data;
    })
    .catch((error: unknown) => {
      if (generation === getSessionGeneration()) clearAccessToken();
      throw error;
    })
    .finally(() => {
      refreshFlight = null;
    });
  return refreshFlight;
}
// Wait so a rotating Set-Cookie cannot land after login/logout.
export async function settleRefresh(): Promise<void> {
  await refreshFlight?.catch(() => undefined);
}

api.interceptors.request.use(async (config: SessionRequestConfig) => {
  if (isAuthEndpoint(config.url)) {
    config.headers.delete("Authorization");
    return config;
  }
  config._sessionGeneration = getSessionGeneration();
  const session = getAuthSession();
  if (session && session.expiresAt <= Date.now()) await refreshAccessToken();
  const token = getAccessToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  else config.headers.delete("Authorization");
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as SessionRequestConfig | undefined;
    if (error.response?.status !== 401 || !config || isAuthEndpoint(config.url))
      throw error;
    if (config._sessionGeneration !== getSessionGeneration()) throw error;
    if (config._authRetry) {
      clearAccessToken();
      throw error;
    }
    config._authRetry = true;
    const currentToken = getAccessToken();
    // A late 401 from an old token can reuse the refresh already completed.
    if (
      !currentToken ||
      config.headers.get("Authorization") === `Bearer ${currentToken}`
    )
      await refreshAccessToken();
    if (config._sessionGeneration !== getSessionGeneration()) throw error;
    return api.request(config);
  },
);

export default api;
