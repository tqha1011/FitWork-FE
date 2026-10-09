import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, LoaderCircle, LogOut, MoveUpRight } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "../components/ui";
import { useAuth } from "../contexts/authContext";
import { logout } from "../services/authService";
import { authErrorMessage } from "../shared/authErrorMessage";
import "../styles/auth.css";

export default function AccountPage({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  if (!session) return null;
  const Content = embedded ? "section" : "main";
  async function signOut() {
    if (pending) return;
    setPending(true);
    try {
      await logout();
      toast.success("You’re signed out.");
    } catch (error) {
      toast.error(authErrorMessage(error, "logout"), { autoClose: false });
    } finally {
      navigate("/auth/sign-in", { replace: true });
    }
  }
  return (
    <div className={embedded ? "job-form-page" : "auth-page"}>
      {!embedded && (
        <>
          <a className="skip-link" href="#account-content">
            Skip to account
          </a>
          <header className="auth-header">
            <Link className="brand" to="/" aria-label="FitWork home">
              <span className="brand-mark">
                <MoveUpRight size={27} strokeWidth={2.5} aria-hidden="true" />
              </span>
              FitWork<span className="auth-brand-dot">.</span>
            </Link>
            <Button variant="secondary" onClick={signOut} disabled={pending}>
              {pending ? (
                <LoaderCircle className="spin" size={17} aria-hidden="true" />
              ) : (
                <LogOut size={17} aria-hidden="true" />
              )}
              Sign out
            </Button>
          </header>
        </>
      )}
      <Content
        id="account-content"
        className={embedded ? "" : "account-content"}
        tabIndex={-1}
      >
        <section className="card account-card" aria-labelledby="account-title">
          <span className="account-icon">
            <Check size={26} aria-hidden="true" />
          </span>
          <p className="auth-eyebrow">
            {session.user.role === "client"
              ? "Client account"
              : "Freelancer account"}
          </p>
          <h1 id="account-title">You’re signed in.</h1>
          <p className="muted" style={{ marginTop: 12 }}>
            Welcome to FitWork. Your account is ready for your next chapter.
          </p>
          <dl className="account-details">
            <div>
              <dt>Email address</dt>
              <dd>{session.user.email}</dd>
            </div>
            <div>
              <dt>Account type</dt>
              <dd>
                {session.user.role === "client"
                  ? "Client · Hire talent"
                  : "Freelancer · Find work"}
              </dd>
            </div>
          </dl>
        </section>
      </Content>
      {!embedded && (
        <footer className="auth-footer">
          <span>© {new Date().getFullYear()} FitWork</span>
          <span>Independent minds. Meaningful connections.</span>
        </footer>
      )}
    </div>
  );
}
