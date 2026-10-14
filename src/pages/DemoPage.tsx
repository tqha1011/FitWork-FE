import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { isCancel } from "axios";
import { BriefcaseBusiness, Clock, LoaderCircle, LogOut } from "lucide-react";
import { Button } from "../components/ui";
import DemoWorkspace from "../components/DemoWorkspace";
import { useAuth } from "../contexts/authContext";
import ResumeProvider from "../contexts/ResumeProvider";
import { logout, startDemo, switchDemoRole } from "../services/authService";
import { getSessionGeneration } from "../services/authSession";
import { demoErrorMessage } from "../shared/demoErrorMessage";
import type { UserType } from "../types/auth";
import "../styles/resumes.css";
import "../styles/demo.css";

const markerKey = "fitwork.demo.visited";
function hasVisitedDemo(): boolean {
  try {
    return sessionStorage.getItem(markerKey) === "yes";
  } catch {
    return false;
  }
}
function markVisitedDemo(): void {
  try {
    sessionStorage.setItem(markerKey, "yes");
  } catch {
    /* memory state still prevents automatic restart */
  }
}

export default function DemoPage() {
  const { session, initializing } = useAuth();
  const [visited, setVisited] = useState(hasVisitedDemo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const attempted = useRef(false);
  const begin = useCallback(async () => {
    if (attempted.current) return;
    attempted.current = true;
    markVisitedDemo();
    setVisited(true);
    setBusy(true);
    setError("");
    try {
      await startDemo();
    } catch (error) {
      setError(demoErrorMessage(error));
    } finally {
      attempted.current = false;
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    if (session?.demo) {
      markVisitedDemo();
      if (!visited) {
        const timer = window.setTimeout(() => setVisited(true), 0);
        return () => window.clearTimeout(timer);
      }
      return;
    }
    if (!initializing && !session && !visited && !hasVisitedDemo()) {
      const timer = window.setTimeout(() => {
        void begin();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [session, initializing, visited, begin]);
  async function changeRole(userType: UserType) {
    setBusy(true);
    setError("");
    try {
      await switchDemoRole(userType);
    } catch (error) {
      if (!isCancel(error)) setError(demoErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function endDemo() {
    setBusy(true);
    try {
      await logout();
    } catch (error) {
      setError(demoErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="demo-page">
      <a className="skip-link" href="#demo-content">
        Skip to demo workspace
      </a>
      <header className="demo-header">
        <Link to="/demo" className="brand">
          <BriefcaseBusiness className="brand-mark" aria-hidden="true" />
          FitWork <span className="badge badge-info">Demo</span>
        </Link>
        {session?.demo ? (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => void endDemo()}
          >
            <LogOut size={16} aria-hidden="true" />
            End demo
          </Button>
        ) : (
          <Link className="text-link" to="/auth/sign-in">
            Sign in
          </Link>
        )}
      </header>
      {error && (
        <div className="demo-global-error" role="alert">
          {error}
        </div>
      )}
      {initializing || busy || session?.transitioning ? (
        <main
          id="demo-content"
          tabIndex={-1}
          className="system-page"
          role="status"
        >
          <LoaderCircle className="spin" aria-hidden="true" />
          <h1>
            {initializing
              ? "Restoring your session…"
              : session?.demo
                ? "Updating your workspace…"
                : "Preparing your demo…"}
          </h1>
        </main>
      ) : session?.demo ? (
        <ResumeProvider
          key={`${getSessionGeneration()}:${session.demo.sessionId}:${session.user.role}`}
        >
          <DemoWorkspace onSwitch={changeRole} />
        </ResumeProvider>
      ) : (
        <main id="demo-content" tabIndex={-1} className="system-page">
          <div className="empty-icon">
            <Clock aria-hidden="true" />
          </div>
          <p className="eyebrow">FitWork Demo</p>
          <h1>
            {visited
              ? "Demo expired — Start new demo"
              : "Explore both sides of hiring."}
          </h1>
          <p className="muted">
            Try the recruiter and applicant experience with prepared CVs and
            sample evaluations in your own temporary workspace.
          </p>
          <Button onClick={() => void begin()}>
            {visited ? "Start new demo" : "Try demo"}
          </Button>
        </main>
      )}
    </div>
  );
}
