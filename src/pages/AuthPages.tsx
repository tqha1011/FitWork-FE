import { useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  MoveUpRight,
  PenTool,
} from "lucide-react";
import { Button } from "../components/ui";
import { useAuth } from "../contexts/authContext";
import { login, register } from "../services/authService";
import { authErrorMessage } from "../shared/authErrorMessage";
import {
  validateLogin,
  validateRegistration,
  type AuthFieldErrors,
} from "../shared/authValidation";
import type { UserType } from "../types/auth";
import "../styles/auth.css";

const fieldLabels: Record<string, string> = {
  email: "Email address",
  password: "Password",
  username: "Username",
  fullName: "Full name",
  userType: "Account type",
};

export function AuthPage() {
  const { pathname } = useLocation();
  return <AuthScreen key={pathname} signup={pathname === "/auth/sign-up"} />;
}

function AuthScreen({ signup }: { signup: boolean }) {
  const { session, initializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registration = location.state as {
    registered?: boolean;
    email?: string;
  } | null;
  const [userType, setUserType] = useState<UserType>("APPLICANT");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(registration?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const submitted = useRef(false);
  const errorSummary = useRef<HTMLDivElement>(null);

  if (session)
    return <Navigate to={`/${session.user.role}/dashboard`} replace />;

  const inputState = (field: keyof AuthFieldErrors) => ({
    id: field,
    name: field,
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field]
      ? `${field}-error`
      : field === "password" && signup
        ? "password-hint"
        : undefined,
  });
  const fieldError = (field: keyof AuthFieldErrors) =>
    errors[field] && (
      <span id={`${field}-error`} className="field-error-text">
        {errors[field]}
      </span>
    );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted.current || initializing) return;
    setFormError("");
    const input = {
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      username: username.trim(),
      userType,
    };
    const next = signup ? validateRegistration(input) : validateLogin(input);
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => errorSummary.current?.focus());
      return;
    }
    submitted.current = true;
    setPending(true);
    try {
      if (signup) {
        await register(input);
        navigate("/auth/sign-in", {
          replace: true,
          state: { registered: true, email: input.email },
        });
      } else {
        const authenticated = await login({ email: input.email, password });
        navigate(`/${authenticated.user.role}/dashboard`, { replace: true });
      }
    } catch (error: unknown) {
      const message = authErrorMessage(error, signup ? "register" : "login");
      setFormError(message);
      requestAnimationFrame(() => errorSummary.current?.focus());
    } finally {
      submitted.current = false;
      setPending(false);
    }
  }

  return (
    <div className="auth-page">
      <a className="skip-link" href="#auth-content">
        Skip to form
      </a>
      <header className="auth-header">
        <Link className="brand" to="/" aria-label="FitWork home">
          <span className="brand-mark">
            <MoveUpRight size={27} strokeWidth={2.5} aria-hidden="true" />
          </span>
          FitWork<span className="auth-brand-dot">.</span>
        </Link>
        <div className="auth-header-action">
          <span>{signup ? "Already a member?" : "New here?"}</span>
          <Link
            className="button button-secondary"
            to={signup ? "/auth/sign-in" : "/auth/sign-up"}
          >
            {signup ? "Sign in" : "Create an account"}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>
      <main className={`auth-layout ${signup ? "auth-layout-signup" : ""}`}>
        <aside className="auth-story" aria-label="About FitWork">
          <span className="auth-story-overline">
            Independent talent. Shared ambition.
          </span>
          <h2>
            Good work starts <br />
            with a good fit.
          </h2>
          <p>
            A place for independent minds and the teams who need them. Find your
            next opportunity, or the talent to bring an idea to life.
          </p>
          <div className="auth-work-note">
            <div className="auth-note-top">
              <span className="auth-note-icon">
                <PenTool size={22} aria-hidden="true" />
              </span>
              <span>Made for meaningful work</span>
              <MoveUpRight size={19} aria-hidden="true" />
            </div>
            <h3>
              Your skills.
              <br />
              Their next big idea.
            </h3>
            <p>
              Find work that fits your strengths, with clear expectations from
              the start.
            </p>
            <div className="auth-note-footer">
              <span className="auth-note-check">
                <Check size={16} aria-hidden="true" />
              </span>
              Different skills. Better together.
            </div>
          </div>
          <div className="auth-story-foot">
            <span className="auth-foot-line" />
            Room for your next chapter.
          </div>
        </aside>
        <section
          id="auth-content"
          className="auth-form-region"
          aria-labelledby="auth-title"
          tabIndex={-1}
        >
          <form
            className="auth-form"
            onSubmit={submit}
            noValidate
            aria-busy={pending}
          >
            <div className="auth-form-heading">
              <p className="auth-eyebrow">
                {signup ? "Join FitWork" : "Welcome back"}
              </p>
              <h1 id="auth-title">
                {signup ? "Make your next move." : "Good to see you again."}
              </h1>
              <p className="muted">
                {signup
                  ? "Create an account for the way you work."
                  : "Sign in to your FitWork account."}
              </p>
            </div>
            {registration?.registered && !signup && (
              <div className="auth-notice auth-notice-success" role="status">
                <Check size={19} aria-hidden="true" />
                <p>Your account is ready. Sign in to get started.</p>
              </div>
            )}
            {(formError || Object.keys(errors).length > 0) && (
              <div
                ref={errorSummary}
                className="auth-notice auth-notice-error"
                role="alert"
                tabIndex={-1}
              >
                <AlertCircle size={19} aria-hidden="true" />
                <div>
                  {formError || (
                    <>
                      <strong>Check the following fields:</strong>
                      <ul>
                        {Object.entries(errors).map(([field, message]) => (
                          <li key={field}>
                            <a
                              href={`#${field}`}
                              aria-label={`${fieldLabels[field] ?? field}: ${message}`}
                              title={message}
                            >
                              {fieldLabels[field] ?? field}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}
            <fieldset className="auth-fields" disabled={pending}>
              <legend className="sr-only">
                {signup ? "Create your account" : "Sign-in details"}
              </legend>
              {signup && (
                <fieldset className="role-options" id="userType">
                  <legend>I’m here to</legend>
                  {(["APPLICANT", "COMPANY"] as const).map((value) => (
                    <label
                      key={value}
                      className={`role-option ${userType === value ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="userType"
                        value={value}
                        checked={userType === value}
                        onChange={() => setUserType(value)}
                      />
                      {value === "APPLICANT" ? (
                        <PenTool size={20} aria-hidden="true" />
                      ) : (
                        <BriefcaseBusiness size={20} aria-hidden="true" />
                      )}
                      <span>
                        <strong>
                          {value === "APPLICANT" ? "Find work" : "Hire talent"}
                        </strong>
                        <small>
                          {value === "APPLICANT" ? "Freelancer" : "Client"}
                        </small>
                      </span>
                      {userType === value && (
                        <Check
                          size={15}
                          className="role-check"
                          aria-hidden="true"
                        />
                      )}
                    </label>
                  ))}
                </fieldset>
              )}
              {signup && (
                <div className="auth-name-fields">
                  <div
                    className={`field ${errors.fullName ? "field-error" : ""}`}
                  >
                    <label className="field-label" htmlFor="fullName">
                      Full name
                    </label>
                    <input
                      {...inputState("fullName")}
                      autoComplete="name"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                    {fieldError("fullName")}
                  </div>
                  <div
                    className={`field ${errors.username ? "field-error" : ""}`}
                  >
                    <label className="field-label" htmlFor="username">
                      Username
                    </label>
                    <input
                      {...inputState("username")}
                      autoComplete="username"
                      placeholder="Your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      minLength={3}
                      required
                    />
                    {fieldError("username")}
                  </div>
                </div>
              )}
              <div className={`field ${errors.email ? "field-error" : ""}`}>
                <label className="field-label" htmlFor="email">
                  Email address
                </label>
                <input
                  {...inputState("email")}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  spellCheck={false}
                  autoCapitalize="none"
                  required
                />
                {fieldError("email")}
              </div>
              <div className={`field ${errors.password ? "field-error" : ""}`}>
                <label className="field-label" htmlFor="password">
                  Password
                </label>
                <div className="password-input">
                  <input
                    {...inputState("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete={signup ? "new-password" : "current-password"}
                    placeholder={
                      signup
                        ? "Create a strong password"
                        : "Enter your password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff size={19} aria-hidden="true" />
                    ) : (
                      <Eye size={19} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {signup && (
                  <span className="field-hint" id="password-hint">
                    8+ characters, uppercase, lowercase, number &amp; special
                    character.
                  </span>
                )}
                {fieldError("password")}
              </div>
            </fieldset>
            <Button
              className="auth-submit"
              type="submit"
              disabled={pending || initializing}
            >
              {pending || initializing ? (
                <LoaderCircle size={18} className="spin" aria-hidden="true" />
              ) : null}
              {initializing
                ? "Checking your session…"
                : pending
                  ? signup
                    ? "Creating account…"
                    : "Signing in…"
                  : signup
                    ? "Create account"
                    : "Sign in"}
              {!pending && !initializing && (
                <ArrowRight size={18} aria-hidden="true" />
              )}
            </Button>
            <p className="auth-switch">
              {signup
                ? "Already have an account? "
                : "Don’t have an account yet? "}
              <Link
                className="text-link"
                to={signup ? "/auth/sign-in" : "/auth/sign-up"}
              >
                {signup ? "Sign in" : "Join FitWork"}
              </Link>
            </p>
          </form>
        </section>
      </main>
      <footer className="auth-footer">
        <span>© {new Date().getFullYear()} FitWork</span>
        <span>Independent minds. Meaningful connections.</span>
      </footer>
    </div>
  );
}
