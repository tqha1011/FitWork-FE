import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AuthContext } from "./authContext";
import { getAuthSession, subscribeAuthSession } from "../services/authSession";
import { initializeSession } from "../services/authService";
import { refreshAccessToken } from "../services/api";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession);
  const [initializing, setInitializing] = useState(true);
  useEffect(() => {
    let active = true;
    void initializeSession().finally(() => {
      if (active) setInitializing(false);
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(
      () => {
        void refreshAccessToken().catch(() => undefined);
      },
      Math.max(0, session.expiresAt - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [session]);
  return (
    <AuthContext.Provider value={{ session, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}
