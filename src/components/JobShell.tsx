import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  FilePlus2,
  Files,
  LogOut,
  MoveUpRight,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/authContext";
import { logout } from "../services/authService";
import { authErrorMessage } from "../shared/authErrorMessage";
import { Button } from "./ui";
import "../styles/jobs.css";
import "../styles/resumes.css";

export default function JobShell() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const client = session?.user.role === "client";
  async function signOut() {
    if (pending) return;
    setPending(true);
    try {
      await logout();
    } catch (error) {
      toast.error(authErrorMessage(error, "logout"), { autoClose: false });
    } finally {
      navigate("/auth/sign-in", { replace: true });
    }
  }
  return (
    <div className="job-workspace">
      <a className="skip-link" href="#job-content">
        Skip to content
      </a>
      <aside className="job-sidebar">
        <NavLink className="brand" to="/jobs">
          <span className="brand-mark">
            <MoveUpRight aria-hidden="true" size={24} />
          </span>
          FitWork
        </NavLink>
        <p className="eyebrow job-role">
          {client ? "Client workspace" : "Freelancer workspace"}
        </p>
        <nav className="job-navigation" aria-label="Workspace">
          <NavLink to="/jobs">
            <BriefcaseBusiness size={19} aria-hidden="true" />
            {client ? "Browse Jobs" : "Find Jobs"}
          </NavLink>
          {client ? (
            <NavLink to="/client/jobs/new">
              <FilePlus2 size={19} aria-hidden="true" />
              Post Job
            </NavLink>
          ) : (
            <NavLink to="/freelancer/applications">
              <Files size={19} aria-hidden="true" />
              My Applications
            </NavLink>
          )}
          <NavLink to={client ? "/client/evaluations" : "/freelancer/resumes"}>
            <Files size={19} aria-hidden="true" />
            {client ? "Applicant Evaluations" : "My Resumes"}
          </NavLink>
          {!client && (
            <NavLink to="/freelancer/evaluations">
              <Sparkles size={19} aria-hidden="true" />
              My Evaluations
            </NavLink>
          )}
          <NavLink to="/account">
            <UserRound size={19} aria-hidden="true" />
            Account
          </NavLink>
        </nav>
        <div className="job-sidebar-account">
          <p>{session?.user.email}</p>
          <Button variant="ghost" disabled={pending} onClick={signOut}>
            <LogOut size={18} aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </aside>
      <div className="job-main">
        <header className="job-utility">
          <span>Independent work. Meaningful connections.</span>
          <span className="role-chip">{client ? "Client" : "Freelancer"}</span>
        </header>
        <main id="job-content" className="job-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
