import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AuthContext } from "./authContext";
import {
  clearAccessToken,
  getAuthSession,
  subscribeAuthSession,
} from "../services/authSession";
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
    if (!session || session.transitioning) return;
    const timer = window.setTimeout(
      () => {
        void refreshAccessToken().catch(() => undefined);
      },
      Math.max(0, session.expiresAt - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [session]);
  const demoDeadline = session?.demo?.expiresAt;
  useEffect(() => {
    if (!demoDeadline) return;
    const timer = window.setTimeout(
      clearAccessToken,
      Math.max(0, demoDeadline - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [demoDeadline]);
  return (
    <AuthContext.Provider value={{ session, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}
