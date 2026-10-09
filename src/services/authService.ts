import type {
  AuthSession,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
} from "../types/auth.ts";
import { api, refreshAccessToken, settleRefresh } from "./api.ts";
import {
  clearAccessToken,
  getSessionGeneration,
  setAuthSession,
} from "./authSession.ts";
let logoutFlight: Promise<void> | null = null;
let loginFlight: Promise<AuthSession> | null = null;
export async function register(
  input: RegisterRequest,
): Promise<{ publicId: string }> {
  const { data } = await api.post<{ publicId: string }>(
    "/auth/register",
    input,
  );
  return data;
}
export function login(input: LoginRequest): Promise<AuthSession> {
  const previousLogin = loginFlight;
  const previousLogout = logoutFlight;
  clearAccessToken();
  const generation = getSessionGeneration();
  // Each response can mutate the HttpOnly cookie even when its local session
  // is superseded. Finish earlier mutations before sending the next login.
  const flight = (async () => {
    await settleRefresh();
    await previousLogin?.catch(() => undefined);
    await previousLogout?.catch(() => undefined);
    if (generation !== getSessionGeneration())
      throw new Error("This sign-in request was cancelled.");
    const { data } = await api.post<TokenResponse>("/auth/login", input);
    return setAuthSession(data, generation);
  })().finally(() => {
    if (loginFlight === flight) loginFlight = null;
  });
  loginFlight = flight;
  return flight;
}
export function logout(): Promise<void> {
  if (logoutFlight) return logoutFlight;
  const pendingLogin = loginFlight;
  clearAccessToken();
  logoutFlight = settleRefresh()
    .then(() => pendingLogin?.catch(() => undefined))
    .then(() => api.post<void>("/auth/logout"))
    .then(() => undefined)
    .finally(() => {
      logoutFlight = null;
    });
  return logoutFlight;
}
let initialization: Promise<void> | null = null;
export function initializeSession(): Promise<void> {
  initialization ??= refreshAccessToken()
    .then(() => undefined)
    .catch(() => undefined);
  return initialization;
}
