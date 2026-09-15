import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  MoveUpRight,
  PenTool,
} from "lucide-react";
import { Button, ButtonLink, Field } from "../components/ui";
import { useMarketplace } from "../contexts/marketplaceContext";
import type { Role } from "../types/marketplace";
import "../styles/freelancer.css";

export function AuthPage() {
  const { pathname } = useLocation();
  return <AuthScreen key={pathname} />;
}

function AuthScreen() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { setRole } = useMarketplace();
  const mode = pathname.split("/").pop();
  const signup = mode === "sign-up";
  const selectRole = mode === "select-role";
  const forgot = mode === "forgot-password";
  const reset = mode === "reset-password";
  const [role, chooseRole] = useState<Exclude<Role, "guest">>("freelancer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const title = selectRole
    ? "How would you like to work?"
    : forgot
      ? "Let’s get you back in."
      : reset
        ? "A fresh start."
        : signup
          ? "Your next chapter starts here."
          : "Good to see you again.";
  const description = selectRole
    ? "Choose the workspace that fits what you’re here to do."
    : forgot
      ? "Enter your email to preview the password recovery flow."
      : reset
        ? "Choose a new password for your account."
        : signup
          ? "Make room for work that feels like a good fit."
          : "Sign in and pick up where you left off.";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!selectRole) {
      if (!reset && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        next.email = "Enter a valid email address.";
      if (signup && name.trim().length < 2) next.name = "Enter your full name.";
      if (!forgot && password.length < 8)
        next.password = "Use at least 8 characters.";
      if (reset && password !== confirmation)
        next.confirmation = "Your passwords don’t match.";
      if (signup && !accepted)
        next.accepted = "Confirm you understand this is a sample workspace.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    if (forgot || reset) {
      setSent(true);
      setPending(false);
      return;
    }
    if (signup) {
      navigate("/auth/select-role");
      return;
    }
    setRole(role);
    navigate(`/${role}/dashboard`);
  }
  return (
    <div className="auth-layout">
      <aside className="auth-story" aria-label="About FitWork">
        <span className="auth-story-overline">GOOD WORK. GOOD COMPANY.</span>
        <h2>
          A little more fit.
          <br />A lot more possibility.
        </h2>
        <p>
          A thoughtful space for independent talent and the teams who need them.
        </p>
        <div className="auth-mini-workspace" aria-hidden="true">
          <div className="auth-mini-top">
            <span className="auth-mini-symbol">
              <PenTool size={20} />
            </span>
            <span>Room for your next big idea</span>
            <MoveUpRight size={18} />
          </div>
          <h3>
            Work on something
            <br />
            that matters to you.
          </h3>
          <div className="auth-mini-tags">
            <span>Creative freedom</span>
            <span>Clear expectations</span>
          </div>
          <div className="auth-mini-line" />
          <div className="auth-mini-bottom">
            <span className="auth-people">
              <i>JL</i>
              <i>SR</i>
              <i>AM</i>
            </span>
            <span>
              Different skills.
              <br />
              Shared ambition.
            </span>
          </div>
        </div>
        <span className="auth-story-foot">
          Independent minds. Meaningful connections.
        </span>
      </aside>
      <section className="auth-form-region">
        {sent ? (
          <div className="auth-form stack">
            <span className="auth-success-icon">
              <Check size={26} />
            </span>
            <h1>
              {forgot ? "Check your next step" : "You’re ready to sign in"}
            </h1>
            <p className="muted">
              {forgot
                ? "This is a sample recovery flow, so no email has been sent. You can continue to preview setting a new password."
                : "Password reset preview complete. No credentials were saved or changed."}
            </p>
            <ButtonLink to={forgot ? "/auth/reset-password" : "/auth/sign-in"}>
              {forgot ? "Preview password reset" : "Back to sign in"}
              <ArrowRight size={17} />
            </ButtonLink>
          </div>
        ) : (
          <form className="auth-form stack" onSubmit={submit} noValidate>
            <div>
              <p className="auth-eyebrow">YOUR WORK, WITH MORE POSSIBILITY</p>
              <h1>{title}</h1>
              <p className="muted">{description}</p>
            </div>
            {(selectRole || (!forgot && !reset && !signup)) && (
              <fieldset className="role-options">
                <legend>{selectRole ? "I’m here to…" : "Sign in as"}</legend>
                {(["freelancer", "client"] as const).map((value) => (
                  <label
                    key={value}
                    className={`role-option ${role === value ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={role === value}
                      onChange={() => chooseRole(value)}
                    />
                    {value === "freelancer" ? (
                      <PenTool size={21} />
                    ) : (
                      <BriefcaseBusiness size={21} />
                    )}
                    <span>
                      <strong>
                        {value === "freelancer" ? "Find work" : "Hire talent"}
                      </strong>
                      <small>
                        {value === "freelancer"
                          ? "I’m a Freelancer"
                          : "I’m a Client"}
                      </small>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            {signup && (
              <Field label="Full name" error={errors.name}>
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                />
              </Field>
            )}
            {!selectRole && !reset && (
              <Field label="Email address" error={errors.email}>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
            )}
            {!selectRole && !forgot && (
              <Field
                label={reset ? "New password" : "Password"}
                error={errors.password}
                hint={signup || reset ? "At least 8 characters" : undefined}
              >
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      signup || reset ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>
            )}
            {reset && (
              <Field label="Confirm new password" error={errors.confirmation}>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </Field>
            )}
            {!signup && !forgot && !reset && !selectRole && (
              <Link
                className="text-link auth-forgot"
                to="/auth/forgot-password"
              >
                Forgot password?
              </Link>
            )}
            {signup && (
              <Field label="Sample workspace" error={errors.accepted}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(event) => setAccepted(event.target.checked)}
                  />
                  I understand this preview uses fictional accounts and local
                  data.
                </label>
              </Field>
            )}
            <Button type="submit" disabled={pending}>
              {pending
                ? "Just a moment…"
                : selectRole
                  ? `Enter ${role === "client" ? "Client" : "Freelancer"} workspace`
                  : forgot
                    ? "Continue to recovery"
                    : reset
                      ? "Reset password"
                      : signup
                        ? "Create account"
                        : "Sign in"}
              <ArrowRight size={17} />
            </Button>
            <p className="auth-demo-note">
              Explore a sample workspace. Your credentials aren’t saved.
            </p>
            {!selectRole && (
              <p className="auth-switch">
                {signup
                  ? "Already have an account? "
                  : forgot || reset
                    ? "Remember your password? "
                    : "New to FitWork? "}
                <Link
                  className="text-link"
                  to={
                    signup || forgot || reset
                      ? "/auth/sign-in"
                      : "/auth/sign-up"
                  }
                >
                  {signup || forgot || reset ? "Sign in" : "Join us"}
                </Link>
              </p>
            )}
          </form>
        )}
      </section>
    </div>
  );
}
