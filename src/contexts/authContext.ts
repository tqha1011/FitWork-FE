import { createContext, useContext } from "react";
import type { AuthSession } from "../types/auth";
export interface AuthContextValue {
  session: AuthSession | null;
  initializing: boolean;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is missing");
  return value;
}
