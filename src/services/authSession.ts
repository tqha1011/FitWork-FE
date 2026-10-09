import type { AuthSession, TokenResponse } from "../types/auth.ts";

// Access tokens stay in memory. The HttpOnly cookie restores a session after reload.
let session: AuthSession | null = null;
let generation = 0;
let refreshAllowed = true;
const listeners = new Set<() => void>();
export const getAuthSession = (): AuthSession | null => session;
export const getAccessToken = (): string | null => session?.accessToken ?? null;
export const getSessionGeneration = (): number => generation;
export const canRefreshSession = (): boolean => refreshAllowed;
export function subscribeAuthSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function clearAccessToken(): void {
  generation++;
  refreshAllowed = false;
  session = null;
  listeners.forEach((listener) => listener());
}
export function setAuthSession(
  data: TokenResponse,
  expectedGeneration: number,
): AuthSession {
  if (expectedGeneration !== generation)
    throw new Error("This session has ended. Please sign in again.");
  try {
    if (
      !data ||
      typeof data.accessToken !== "string" ||
      !Number.isFinite(data.expiresIn) ||
      data.expiresIn <= 0
    )
      throw new Error();
    const parts = data.accessToken.split(".");
    if (parts.length !== 3) throw new Error();
    const encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes));
    if (
      typeof claims.sub !== "string" ||
      !claims.sub ||
      typeof claims.email !== "string" ||
      !["ROLE_APPLICANT", "ROLE_COMPANY"].includes(claims.role) ||
      typeof claims.exp !== "number" ||
      claims.exp * 1000 <= Date.now()
    )
      throw new Error();
    session = {
      accessToken: data.accessToken,
      expiresAt: Math.min(
        Date.now() + data.expiresIn * 1000,
        claims.exp * 1000,
      ),
      user: {
        publicId: claims.sub,
        email: claims.email,
        role: claims.role === "ROLE_COMPANY" ? "client" : "freelancer",
      },
    };
    refreshAllowed = true;
    listeners.forEach((listener) => listener());
    return session;
  } catch {
    clearAccessToken();
    throw new Error("We couldn't read your sign-in session. Please try again.");
  }
}
