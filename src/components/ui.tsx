import { useEffect, useId, useRef, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useMarketplace } from "../contexts/marketplaceContext";
import type { AiMatch, FreelancerProfile } from "../types/marketplace";

type Variant = "primary" | "secondary" | "ghost" | "danger";
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`button button-${variant} ${className}`}
      {...props}
    />
  );
}
export function ButtonLink({
  to,
  children,
  variant = "primary",
  className = "",
}: {
  to: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link className={`button button-${variant} ${className}`} to={to}>
      {children}
    </Link>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {action && <div className="actions">{action}</div>}
    </header>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`}>{children}</div>;
}
export function Badge({ status }: { status: string }) {
  const treatment = [
    "Open",
    "Accepted",
    "Filled",
    "Verified",
    "Available",
  ].includes(status)
    ? "success"
    : ["Reviewing"].includes(status)
      ? "warning"
      : ["Rejected", "Cancelled"].includes(status)
        ? "error"
        : ["Submitted", "Shortlisted"].includes(status)
          ? "info"
          : "neutral";
  return (
    <span className={`badge badge-${treatment}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}
export function SkillChip({ children }: { children: ReactNode }) {
  return <span className="skill-chip">{children}</span>;
}
export function Avatar({
  name,
  size,
}: {
  name: string;
  size?: "small" | "large";
}) {
  return (
    <span
      aria-hidden="true"
      className={`avatar ${size ? `avatar-${size}` : ""}`}
    >
      {name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function Verified({ verified }: { verified: boolean }) {
  return verified ? (
    <span
      className="verified"
      title="Verified identity (demo)"
      aria-label="Verified identity (demo)"
    >
      <ShieldCheck size={15} />
    </span>
  ) : null;
}
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className={`field ${error ? "field-error" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
      {error && (
        <span className="field-error-text" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="empty-state">
      <span className="empty-icon">
        <Search size={28} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}
export function LoadingSkeleton() {
  return (
    <div className="skeleton-list" role="status" aria-label="Loading content">
      <span className="sr-only">Loading content…</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card skeleton-card">
          <div className="skeleton skeleton-title" />
          <div className="skeleton" />
          <div className="skeleton skeleton-short" />
        </div>
      ))}
    </div>
  );
}
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="empty-state" role="alert">
      <AlertCircle size={32} />
      <h2>Something didn't load</h2>
      <p>Your changes are safe. Try loading this view again.</p>
      <Button onClick={onRetry}>Try again</Button>
    </section>
  );
}
export function DataBoundary({
  children,
  empty = false,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Your activity will appear here when you get started.",
  action,
}: {
  children: ReactNode;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  action?: ReactNode;
}) {
  const { previewState, setPreviewState } = useMarketplace();
  if (previewState === "loading") return <LoadingSkeleton />;
  if (previewState === "error")
    return <ErrorState onRetry={() => setPreviewState("populated")} />;
  if (previewState === "unauthorized")
    return (
      <EmptyState
        title="Sign in to continue"
        description="This workspace is available after you sign in."
        action={<ButtonLink to="/auth/sign-in">Sign in</ButtonLink>}
      />
    );
  if (previewState === "forbidden")
    return (
      <EmptyState
        title="This space belongs to someone else"
        description="Your current role does not have access to this content."
        action={<ButtonLink to="/jobs">Find Jobs</ButtonLink>}
      />
    );
  if (previewState === "not-found")
    return (
      <EmptyState
        title="We couldn't find that"
        description="This item may have moved or is no longer available."
        action={<ButtonLink to="/jobs">Explore Jobs</ButtonLink>}
      />
    );
  if (previewState === "filtered-empty")
    return (
      <EmptyState
        title="No matches this time"
        description="Try a different search or remove a filter to broaden your results."
        action={
          <Button onClick={() => setPreviewState("populated")}>
            Clear filters
          </Button>
        }
      />
    );
  if (empty || previewState === "empty")
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={action}
      />
    );
  return children;
}
export function Dialog({
  open,
  title,
  children,
  onClose,
  className = "",
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (open) {
      dialog?.showModal();
    } else {
      dialog?.close();
    }
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const focusable = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter(
          (element) =>
            !element.matches(":disabled") &&
            element.getClientRects().length > 0,
        );
        const first = focusable[0];
        const last = focusable.at(-1);
        if (!first) {
          event.preventDefault();
          return;
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-header">
        <h2 id={titleId}>{title}</h2>
        <Button
          variant="ghost"
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  destructive = false,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  destructive?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog
      open={open}
      title={title}
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      <p className="muted">{description}</p>
      {error && (
        <p role="alert" className="field-error-text">
          {error}
        </p>
      )}
      <div className="dialog-actions">
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          Keep as is
        </Button>
        <Button
          variant={destructive ? "danger" : "primary"}
          onClick={confirm}
          disabled={pending}
        >
          {pending && <LoaderCircle className="spin" size={16} />}{" "}
          {pending ? "Updating…" : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total < 2) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <Button
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={16} /> Previous
      </Button>
      <span className="pagination-numbers">
        {Array.from({ length: total }, (_, i) => i + 1)
          .filter((i) => Math.abs(i - page) < 2 || i === 1 || i === total)
          .map((i) => (
            <button
              className={page === i ? "active" : ""}
              key={i}
              aria-label={`Page ${i}`}
              aria-current={page === i ? "page" : undefined}
              onClick={() => onChange(i)}
            >
              {i}
            </button>
          ))}
      </span>
      <span className="pagination-mobile">
        {page} of {total}
      </span>
      <Button
        variant="secondary"
        disabled={page >= total}
        onClick={() => onChange(page + 1)}
      >
        Next <ChevronRight size={16} />
      </Button>
    </nav>
  );
}
export function AiMatchSummary({
  match,
  compact = false,
}: {
  match: AiMatch;
  compact?: boolean;
}) {
  const { aiState, setAiState } = useMarketplace();
  if (aiState === "calculating")
    return (
      <div className="ai-panel" role="status">
        <Sparkles size={16} />
        <span>Calculating AI Match…</span>
        <div className="skeleton skeleton-short" />
      </div>
    );
  if (aiState === "unavailable")
    return (
      <div className="ai-panel">
        <h3>
          <Sparkles size={16} /> AI Match unavailable
        </h3>
        <p>There isn't enough information to explain this match.</p>
        <Button variant="secondary" onClick={() => setAiState("ready")}>
          Retry match
        </Button>
      </div>
    );
  if (compact)
    return (
      <span className="ai-compact">
        <Sparkles size={14} />
        {match.label} match <span>· Demo</span>
      </span>
    );
  return (
    <section className="ai-panel">
      <div className="section-heading">
        <h3>
          <Sparkles size={18} /> AI Match
        </h3>
        <span className="ai-score">
          {match.percentage}% <small>Demo score</small>
        </span>
      </div>
      <strong>{match.label} match</strong>
      {aiState === "stale" && (
        <p className="notice">
          This match uses an older profile.{" "}
          <button className="text-link" onClick={() => setAiState("ready")}>
            Refresh match
          </button>
        </p>
      )}
      <p>{match.explanation}</p>
      <ul className="match-factors">
        {match.matching.map((s) => (
          <li key={s}>
            <Check size={15} />
            {s}
          </li>
        ))}
      </ul>
      <p>
        <strong>Worth discussing</strong>
        <br />
        {match.missing.join(" · ")}
      </p>
      <p className="ai-disclaimer">
        AI Match is a recommendation based on available profile and Job
        information. Review the full Application before making a decision.
        Scores are demonstration data.
      </p>
    </section>
  );
}
export function ProfileCompleteness({
  profile,
}: {
  profile: FreelancerProfile;
}) {
  const parts = [
    { label: "a biography", done: !!profile.bio.trim() },
    { label: "skills", done: profile.skills.length > 0 },
    { label: "work experience", done: profile.experience.length > 0 },
    { label: "portfolio evidence", done: profile.portfolio.length > 0 },
    {
      label: "a professional title and rate",
      done: !!profile.title.trim() && profile.rate > 0,
    },
  ];
  const complete = parts.filter((p) => p.done).length * 20;
  return (
    <section className="profile-completeness">
      <div className="section-heading">
        <h3>Your profile</h3>
        <strong>{complete}%</strong>
      </div>
      <progress aria-label="Profile completeness" value={complete} max={100} />
      <p className="muted">
        {complete === 100
          ? "Looking good. Your profile tells the full story."
          : `Add ${parts
              .filter((p) => !p.done)
              .map((p) => p.label)
              .join(", ")} to show more of your work.`}
      </p>
      <Link className="text-link" to="/freelancer/profile/edit">
        {complete === 100 ? "Keep it up to date" : "Complete your profile"}
        <ArrowRight size={15} />
      </Link>
    </section>
  );
}
