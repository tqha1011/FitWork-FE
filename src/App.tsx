import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { ToastContainer } from "react-toastify";
import AuthProvider from "./contexts/AuthProvider";
import { useAuth } from "./contexts/authContext";
import { AuthPage } from "./pages/AuthPages";
import DemoPage from "./pages/DemoPage";
import AccountPage from "./pages/AccountPage";
import type { AccountRole } from "./types/auth";
import ResumeProvider from "./contexts/ResumeProvider";
import ResumesPage from "./pages/ResumesPage";
import CompanyEvaluationPage from "./pages/CompanyEvaluationPage";
import ApplicantEvaluationPage from "./pages/ApplicantEvaluationPage";
import JobProvider from "./contexts/JobProvider";
import { getSessionGeneration } from "./services/authSession";
import JobShell from "./components/JobShell";
import JobsPage from "./pages/JobsPage";
import CreateJobPage from "./pages/CreateJobPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import { Outlet } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

function ProtectedRoute({ role }: { role?: AccountRole }) {
  const { session, initializing } = useAuth();
  if (initializing)
    return (
      <main className="auth-session-loading" role="status">
        <LoaderCircle size={20} className="spin" aria-hidden="true" />
        Checking your session…
      </main>
    );
  if (!session) return <Navigate to="/auth/sign-in" replace />;
  if (session.demo) return <Navigate to="/demo" replace />;
  if (role && session.user.role !== role)
    return <Navigate to="/jobs" replace />;
  return <Outlet />;
}

function JobWorkspace() {
  const { session } = useAuth();
  return (
    <JobProvider
      key={`${getSessionGeneration()}:${session?.user.publicId}:${session?.user.role}`}
    >
      <ResumeProvider>
        <JobShell />
      </ResumeProvider>
    </JobProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/" element={<Navigate to="/auth/sign-in" replace />} />
          <Route path="/auth/sign-in" element={<AuthPage />} />
          <Route path="/auth/sign-up" element={<AuthPage />} />
          <Route
            path="/login"
            element={<Navigate to="/auth/sign-in" replace />}
          />
          <Route
            path="/register"
            element={<Navigate to="/auth/sign-up" replace />}
          />
          <Route
            path="/auth/login"
            element={<Navigate to="/auth/sign-in" replace />}
          />
          <Route
            path="/auth/register"
            element={<Navigate to="/auth/sign-up" replace />}
          />
          <Route
            path="/auth/select-role"
            element={<Navigate to="/auth/sign-up" replace />}
          />
          <Route
            path="/freelancer/dashboard"
            element={<Navigate to="/jobs" replace />}
          />
          <Route
            path="/client/dashboard"
            element={<Navigate to="/jobs" replace />}
          />
          <Route element={<ProtectedRoute />}>
            <Route element={<JobWorkspace />}>
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/account" element={<AccountPage embedded />} />
              <Route element={<ProtectedRoute role="client" />}>
                <Route path="/client/jobs/new" element={<CreateJobPage />} />
                <Route
                  path="/client/evaluations"
                  element={<CompanyEvaluationPage />}
                />
                <Route
                  path="/client/jobs/:jobPublicId/evaluations/:evaluationPublicId"
                  element={<CompanyEvaluationPage />}
                />
              </Route>
              <Route element={<ProtectedRoute role="freelancer" />}>
                <Route
                  path="/freelancer/evaluations"
                  element={<ApplicantEvaluationPage />}
                />
                <Route
                  path="/freelancer/evaluations/:jobPublicId"
                  element={<ApplicantEvaluationPage />}
                />
                <Route path="/freelancer/resumes" element={<ResumesPage />} />
                <Route
                  path="/freelancer/applications"
                  element={<ApplicationsPage />}
                />
              </Route>
            </Route>
          </Route>
          <Route
            path="*"
            element={
              <main className="system-page">
                <h1>Page not found</h1>
                <p className="muted">
                  This page may have moved or is no longer available.
                </p>
                <a href="/" className="text-link">
                  Back to FitWork
                </a>
              </main>
            }
          />
        </Routes>
        <ToastContainer position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}
