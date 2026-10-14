import type {
  AuthSession,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserType,
} from "../types/auth.ts";
import { api, refreshAccessToken, settleRefresh } from "./api.ts";
import {
  clearAccessToken,
  getAccessToken,
  getAuthSession,
  beginSessionTransition,
  blockSessionRefresh,
  allowSessionRefresh,
  getSessionGeneration,
  setAuthSession,
} from "./authSession.ts";
let signInIntent = 0;
let loginCookie: { token?: string } | undefined;
let switchCookie: { token?: string } | undefined;
let logoutFlight: Promise<void> | null = null;
let switchFlight: Promise<AuthSession> | null = null;
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
  return signIn("/auth/login", input);
}
export function startDemo(
  userType: UserType = "COMPANY",
): Promise<AuthSession> {
  return signIn("/auth/demo", { userType });
}
function signIn(
  endpoint: string,
  input: LoginRequest | { userType: UserType },
): Promise<AuthSession> {
  signInIntent++;
  const cookie: { token?: string } = {};
  loginCookie = cookie;
  const previousLogin = loginFlight;
  const previousLogout = logoutFlight;
  const previousSwitch = switchFlight;
  clearAccessToken();
  const generation = getSessionGeneration();
  // Each response can mutate the HttpOnly cookie even when its local session
  // is superseded. Finish earlier mutations before sending the next login.
  const flight = (async () => {
    await settleRefresh();
    await previousSwitch?.catch(() => undefined);
    await previousLogin?.catch(() => undefined);
    await previousLogout?.catch(() => undefined);
    if (generation !== getSessionGeneration())
      throw new Error("This sign-in request was cancelled.");
    const { data } = await api.post<TokenResponse>(endpoint, input);
    cookie.token = data.accessToken;
    return setAuthSession(data, generation);
  })().finally(() => {
    if (loginFlight === flight) {
      loginFlight = null;
      loginCookie = undefined;
    }
  });
  loginFlight = flight;
  return flight;
}
export function switchDemoRole(userType: UserType): Promise<AuthSession> {
  if (switchFlight) return switchFlight;
  if (logoutFlight || !getAuthSession()?.demo)
    return Promise.reject(new Error("Start a demo first."));
  const cookie: { token?: string } = {};
  switchCookie = cookie;
  const expected = getSessionGeneration();
  const current = getAuthSession();
  if (current && current.expiresAt <= Date.now()) {
    void refreshAccessToken().catch(() => undefined);
  }
  // Reserve the cookie mutation before yielding. An existing refresh may finish,
  // but installing its token must not lift this barrier.
  const releaseRefresh = blockSessionRefresh();
  const flight = (async () => {
    await settleRefresh();
    if (expected !== getSessionGeneration())
      throw new Error("Role switch cancelled.");
    const previous = getAuthSession();
    if (!previous?.demo) throw new Error("Start a demo first.");
    const generation = beginSessionTransition();
    try {
      const { data } = await api.post<TokenResponse>(
        "/auth/demo/switch",
        { userType },
        {
          headers: { Authorization: `Bearer ${previous.accessToken}` },
        },
      );
      cookie.token = data.accessToken;
      return setAuthSession(data, generation);
    } catch (error) {
      // The cookie may have rotated even if the response was lost. Recover from
      // the server's cookie rather than reinstalling an obsolete role token.
      if (generation === getSessionGeneration()) {
        releaseRefresh();
        allowSessionRefresh();
        try {
          await refreshAccessToken();
        } catch {
          /* refresh terminates invalid sessions */
        }
      }
      throw error;
    }
  })().finally(() => {
    releaseRefresh();
    if (switchFlight === flight) {
      switchFlight = null;
      switchCookie = undefined;
    }
  });
  switchFlight = flight;
  return flight;
}
export function logout(): Promise<void> {
  if (logoutFlight) return logoutFlight;
  const pendingLogin = loginFlight;
  const requestedIntent = signInIntent;
  const pendingLoginCookie = pendingLogin ? loginCookie : undefined;
  const pendingSwitchCookie = switchFlight ? switchCookie : undefined;
  const initialToken = getAccessToken();
  const pendingSwitch = switchFlight;
  const releaseRefresh = blockSessionRefresh();
  const flight = (async () => {
    const refreshedToken = await settleRefresh();
    await pendingLogin?.catch(() => undefined);
    await pendingSwitch?.catch(() => undefined);
    const token =
      getAccessToken() ??
      pendingLoginCookie?.token ??
      pendingSwitchCookie?.token ??
      refreshedToken ??
      initialToken;
    // A newer sign-in already invalidated the old requests. Do not invalidate
    // that newer intent while finishing this older cookie mutation.
    const generation =
      requestedIntent === signInIntent
        ? beginSessionTransition()
        : getSessionGeneration();
    try {
      await api.post<void>("/auth/logout", undefined, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } finally {
      if (
        requestedIntent === signInIntent &&
        generation === getSessionGeneration()
      )
        clearAccessToken();
    }
  })().finally(() => {
    releaseRefresh();
    if (logoutFlight === flight) logoutFlight = null;
  });
  logoutFlight = flight;
  return flight;
}
let initialization: Promise<void> | null = null;
export function initializeSession(): Promise<void> {
  initialization ??= refreshAccessToken()
    .then(() => undefined)
    .catch(() => undefined);
  return initialization;
}
