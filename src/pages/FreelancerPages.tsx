import { useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Paperclip,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import JobCard from "../components/JobCard";
import {
  AiMatchSummary,
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  DataBoundary,
  EmptyState,
  Field,
  PageHeader,
  Pagination,
  ProfileCompleteness,
} from "../components/ui";
import { useMarketplace } from "../contexts/marketplaceContext";
import type { Application } from "../types/marketplace";
import "../styles/freelancer.css";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
const formatDate = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function ApplicationRow({ application }: { application: Application }) {
  const { jobs, clients } = useMarketplace();
  const job = jobs.find((item) => item.id === application.jobId);
  const client = clients.find((item) => item.id === job?.clientId);
  return (
    <div className="application-row">
      <Avatar name={client?.name ?? "Client"} />
      <div className="application-row-title">
        <Link to={`/freelancer/applications/${application.id}`}>
          {job?.title ?? "Unavailable Job"}
        </Link>
        <span className="muted">
          {client?.name} · Applied {formatDate(application.submittedAt)}
        </span>
      </div>
      <Badge status={application.status} />
      <Link
        className="application-row-arrow"
        to={`/freelancer/applications/${application.id}`}
        aria-label={`View application for ${job?.title ?? "Job"}`}
      >
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}

export function FreelancerDashboard() {
  const { freelancers, freelancerId, jobs, applications, savedIds } =
    useMarketplace();
  const profile = freelancers.find((item) => item.id === freelancerId)!;
  const mine = applications.filter(
    (item) => item.freelancerId === freelancerId,
  );
  const suggested = jobs
    .filter(
      (job) =>
        job.status === "Open" && !mine.some((item) => item.jobId === job.id),
    )
    .sort((a, b) => b.match.percentage - a.match.percentage)
    .slice(0, 2);
  const stats = [
    {
      label: "Active applications",
      count: mine.filter((item) =>
        ["Submitted", "Reviewing", "Shortlisted"].includes(item.status),
      ).length,
      icon: FileText,
      detail: "Your next opportunity is out there",
      href: "/freelancer/applications",
    },
    {
      label: "Shortlisted",
      count: mine.filter((item) => item.status === "Shortlisted").length,
      icon: CheckCircle2,
      detail: "You’re one step closer",
      href: "/freelancer/applications?status=Shortlisted",
    },
    {
      label: "Saved Jobs",
      count: savedIds.length,
      icon: Bookmark,
      detail: "Good possibilities, kept close",
      href: "/freelancer/saved-jobs",
    },
  ];
  return (
    <div className="stack">
      <PageHeader
        eyebrow="YOUR WORKSPACE"
        title={`Welcome back, ${profile.name.split(" ")[0]}.`}
        description="Here’s what’s happening with your next chapter."
        action={
          <ButtonLink to="/jobs">
            Find your next Job
            <ArrowRight size={17} />
          </ButtonLink>
        }
      />
      <DataBoundary>
        <div className="stats-grid">
          {stats.map(({ label, count, icon: Icon, detail, href }) => (
            <Link className="stat-card freelancer-stat" to={href} key={label}>
              <div>
                <span>{label}</span>
                <Icon size={19} />
              </div>
              <strong>{count.toString().padStart(2, "0")}</strong>
              <small>{detail}</small>
            </Link>
          ))}
        </div>
        <div className="freelancer-overview-grid">
          <div className="stack">
            <section>
              <div className="section-heading">
                <div>
                  <h2>Picked for your skills</h2>
                  <p className="muted">A few Jobs worth a closer look.</p>
                </div>
                <Link to="/jobs" className="text-link">
                  View all Jobs <ArrowRight size={15} />
                </Link>
              </div>
              <div className="stack">
                {suggested.map((job) => (
                  <JobCard job={job} key={job.id} />
                ))}
                {!suggested.length && (
                  <EmptyState
                    title="More possibilities ahead"
                    description="Browse all Jobs to explore available opportunities."
                    action={<ButtonLink to="/jobs">Browse Jobs</ButtonLink>}
                  />
                )}
              </div>
            </section>
            <section>
              <div className="section-heading">
                <h2>Recent applications</h2>
                <Link className="text-link" to="/freelancer/applications">
                  View all
                </Link>
              </div>
              <Card>
                <div className="application-list">
                  {mine.slice(0, 3).map((application) => (
                    <ApplicationRow
                      key={application.id}
                      application={application}
                    />
                  ))}
                  {!mine.length && (
                    <EmptyState
                      title="Your next chapter starts here"
                      description="Apply to a Job and keep track of the conversation here."
                    />
                  )}
                </div>
              </Card>
            </section>
          </div>
          <aside className="stack">
            <Card>
              <div className="dashboard-profile">
                <Avatar name={profile.name} size="large" />
                <h3>{profile.name}</h3>
                <p className="muted">{profile.title}</p>
                <Badge
                  status={
                    profile.available ? "Available for work" : "Not available"
                  }
                />
              </div>
              <div className="divider" />
              <ProfileCompleteness profile={profile} />
              <ButtonLink
                className="full-width"
                variant="secondary"
                to="/freelancer/profile/edit"
              >
                Refine your profile
                <ArrowRight size={16} />
              </ButtonLink>
            </Card>
            <Card className="freelancer-tip">
              <Sparkles size={21} />
              <h3>Let your work speak.</h3>
              <p className="muted">
                A focused portfolio helps Clients see how you think. Add a
                recent piece of work and the story behind it.
              </p>
              <Link
                className="text-link"
                to="/freelancer/profile/edit#portfolio"
              >
                Update your portfolio
                <ArrowRight size={15} />
              </Link>
            </Card>
          </aside>
        </div>
      </DataBoundary>
    </div>
  );
}

export function SavedJobsPage() {
  const { jobs, savedIds } = useMarketplace();
  const [query, setQuery] = useState("");
  const saved = jobs.filter((job) => savedIds.includes(job.id));
  const filtered = saved.filter((job) =>
    `${job.title} ${job.skills.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="stack">
      <PageHeader
        eyebrow="KEEP THE POSSIBILITIES CLOSE"
        title="Saved Jobs"
        description="The opportunities that caught your eye, all in one place."
        action={
          <ButtonLink to="/jobs" variant="secondary">
            Explore Jobs
            <ArrowRight size={17} />
          </ButtonLink>
        }
      />
      <label className="freelancer-search">
        <Search size={19} />
        <input
          aria-label="Search saved Jobs"
          placeholder="Search your saved Jobs"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <p className="muted" role="status">
        {filtered.length} saved {filtered.length === 1 ? "Job" : "Jobs"}
      </p>
      <DataBoundary
        empty={!filtered.length}
        emptyTitle={
          query
            ? "No saved Jobs match your search"
            : "Make a little room for possibility"
        }
        emptyDescription={
          query
            ? "Try a different title or skill."
            : "Save Jobs as you explore. They’ll be here when you’re ready to take the next step."
        }
        action={
          query ? (
            <Button variant="secondary" onClick={() => setQuery("")}>
              Clear search
            </Button>
          ) : (
            <ButtonLink to="/jobs">Find Jobs to save</ButtonLink>
          )
        }
      >
        <div className="grid-2">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </DataBoundary>
    </div>
  );
}

export function ApplicationFormPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const {
    jobs,
    clients,
    freelancers,
    freelancerId,
    applications,
    submitApplication,
  } = useMarketplace();
  const job = jobs.find((item) => item.id === jobId);
  const profile = freelancers.find((item) => item.id === freelancerId)!;
  const existing = applications.find(
    (item) => item.jobId === jobId && item.freelancerId === freelancerId,
  );
  const [coverLetter, setCoverLetter] = useState("");
  const [rate, setRate] = useState("");
  const [duration, setDuration] = useState("");
  const [portfolioIds, setPortfolioIds] = useState<string[]>([]);
  const [attachmentName, setAttachmentName] = useState<string>();
  const [attachmentError, setAttachmentError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  if (!job)
    return (
      <EmptyState
        title="Job not found"
        description="This opportunity is no longer available."
        action={<ButtonLink to="/jobs">Explore Jobs</ButtonLink>}
      />
    );
  if (existing)
    return (
      <EmptyState
        title="You’ve already applied"
        description="Your application and its latest status are available in My Applications."
        action={
          <ButtonLink to={`/freelancer/applications/${existing.id}`}>
            View Application
          </ButtonLink>
        }
      />
    );
  if (job.status !== "Open")
    return (
      <EmptyState
        title="Applications are closed"
        description="This Job is no longer accepting new applications. Explore other opportunities that fit your skills."
        action={<ButtonLink to="/jobs">Browse open Jobs</ButtonLink>}
      />
    );
  const client = clients.find((item) => item.id === job.clientId);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (coverLetter.trim().length < 100)
      next.coverLetter =
        "Write at least 100 characters about your approach and relevant experience.";
    if (!Number.isFinite(Number(rate)) || Number(rate) <= 0)
      next.rate = "Enter a proposed amount greater than zero.";
    if (!duration) next.duration = "Choose an estimated duration.";
    if (attachmentError) next.attachment = attachmentError;
    setErrors(next);
    if (Object.keys(next).length || !job) return;
    setPending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    try {
      const id = submitApplication({
        jobId: job.id,
        coverLetter: coverLetter.trim(),
        rate: Number(rate),
        duration,
        portfolioIds,
        attachmentName,
      });
      navigate(`/freelancer/applications/${id}?submitted=true`);
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "We couldn’t submit your application. Please try again.",
      });
      setPending(false);
    }
  }
  return (
    <div className="stack">
      <Link className="text-link" to={`/jobs/${job.id}`}>
        ← Back to Job
      </Link>
      <PageHeader
        title="Make a thoughtful introduction."
        description="Show the Client what you bring and how you’d approach their Job."
      />
      <DataBoundary>
        <div className="split-layout">
          <form className="stack" onSubmit={submit} noValidate>
            <Card className="stack">
              <div>
                <h2>Your application</h2>
                <p className="muted">A little context goes a long way.</p>
              </div>
              <Field
                label="Cover letter"
                error={errors.coverLetter}
                hint={`${coverLetter.length} / 5,000 characters · minimum 100`}
              >
                <textarea
                  rows={8}
                  maxLength={5000}
                  value={coverLetter}
                  onChange={(event) => setCoverLetter(event.target.value)}
                  placeholder="What interests you about this Job? Tell the Client about relevant work, your approach, and what you’d like to know."
                />
              </Field>
              <div className="form-grid">
                <Field
                  label={
                    job.budgetType === "Hourly"
                      ? "Proposed hourly rate (USD)"
                      : "Proposed total price (USD)"
                  }
                  error={errors.rate}
                >
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="decimal"
                    value={rate}
                    onChange={(event) => setRate(event.target.value)}
                    placeholder={job.budgetType === "Hourly" ? "85" : "4,000"}
                  />
                </Field>
                <Field label="Estimated duration" error={errors.duration}>
                  <select
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                  >
                    <option value="">Choose a timeline</option>
                    {[
                      "Less than 1 week",
                      "1–2 weeks",
                      "2–4 weeks",
                      "4–6 weeks",
                      "1–3 months",
                      "3–6 months",
                    ].map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </Card>
            <Card className="stack">
              <div>
                <h2>Let your work speak</h2>
                <p className="muted">
                  Choose relevant portfolio work to share. Optional, but
                  helpful.
                </p>
              </div>
              {profile.portfolio.length ? (
                profile.portfolio.map((item) => (
                  <label className="portfolio-choice" key={item.id}>
                    <input
                      type="checkbox"
                      checked={portfolioIds.includes(item.id)}
                      onChange={() =>
                        setPortfolioIds((current) =>
                          current.includes(item.id)
                            ? current.filter((id) => id !== item.id)
                            : [...current, item.id],
                        )
                      }
                    />
                    <span>
                      <strong>{item.title}</strong>
                      <small className="muted">{item.description}</small>
                    </span>
                  </label>
                ))
              ) : (
                <p className="muted">
                  No portfolio items yet.{" "}
                  <Link
                    className="text-link"
                    to="/freelancer/profile/edit#portfolio"
                  >
                    Add work to your profile
                  </Link>
                  .
                </p>
              )}
              <Field
                label="Supporting attachment (optional)"
                error={attachmentError || errors.attachment}
                hint="PDF, PNG, JPG, or DOCX · up to 10 MB. Only the file name is included in this sample application."
              >
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.docx"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    const error =
                      file &&
                      (file.size > 10 * 1024 * 1024
                        ? "Choose a file smaller than 10 MB."
                        : !/\.(pdf|png|jpe?g|docx)$/i.test(file.name)
                          ? "Choose a PDF, PNG, JPG, or DOCX file."
                          : "");
                    setAttachmentError(error || "");
                    setAttachmentName(error ? undefined : file?.name);
                  }}
                />
              </Field>
            </Card>
            <Card className="stack">
              <h2>Ready to make your introduction?</h2>
              <div className="application-summary">
                <span>Your proposal</span>
                <strong>
                  {rate
                    ? formatMoney(Number(rate))
                    : "Add your proposed amount"}
                  {job.budgetType === "Hourly" && rate ? " / hr" : ""}
                </strong>
                <span>Timeline</span>
                <strong>{duration || "Choose a timeline"}</strong>
                <span>Portfolio</span>
                <strong>{portfolioIds.length} selected</strong>
              </div>
              <p className="muted">
                Submitting shares your profile, cover letter, proposed terms,
                and selected portfolio with {client?.name}. You can withdraw
                while your application is under consideration.
              </p>
              {errors.form && (
                <p className="field-error" role="alert">
                  {errors.form}
                </p>
              )}
              <div className="actions">
                <Button type="submit" disabled={pending}>
                  {pending ? "Submitting application…" : "Submit Application"}
                  <ArrowRight size={17} />
                </Button>
                <ButtonLink variant="secondary" to={`/jobs/${job.id}`}>
                  Cancel
                </ButtonLink>
              </div>
            </Card>
          </form>
          <aside className="stack">
            <Card className="stack">
              <span className="muted">YOU’RE APPLYING TO</span>
              <h2>{job.title}</h2>
              <Link to={`/clients/${client?.id}`} className="text-link">
                {client?.name}
              </Link>
              <Badge status={job.status} />
              <div className="divider" />
              <div className="application-summary">
                <span>Client’s budget</span>
                <strong>
                  {formatMoney(job.budgetMin)}–{formatMoney(job.budgetMax)}
                  {job.budgetType === "Hourly" ? "/hr" : ""}
                </strong>
                <span>Duration</span>
                <strong>{job.duration}</strong>
                <span>Apply by</span>
                <strong>{formatDate(job.deadline)}</strong>
              </div>
            </Card>
            <AiMatchSummary match={job.match} />
          </aside>
        </div>
      </DataBoundary>
    </div>
  );
}

export function ApplicationsPage() {
  const { applications, freelancerId, jobs } = useMarketplace();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "All";
  const query = params.get("q") || "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const mine = applications.filter(
    (item) => item.freelancerId === freelancerId,
  );
  const filtered = mine.filter(
    (item) =>
      (status === "All" || item.status === status) &&
      jobs
        .find((job) => job.id === item.jobId)
        ?.title.toLowerCase()
        .includes(query.toLowerCase()),
  );
  const changeParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };
  return (
    <div className="stack">
      <PageHeader
        eyebrow="EVERY NEXT STEP, IN ONE PLACE"
        title="My Applications"
        description="Keep an eye on your introductions and what comes next."
        action={
          <ButtonLink to="/jobs">
            Find Jobs
            <ArrowRight size={17} />
          </ButtonLink>
        }
      />
      <div className="freelancer-filter-row">
        <label className="freelancer-search">
          <Search size={19} />
          <input
            aria-label="Search applications"
            value={query}
            onChange={(event) => changeParam("q", event.target.value)}
            placeholder="Search applications by Job"
          />
        </label>
        <label className="freelancer-status-filter">
          Status
          <select
            aria-label="Filter application status"
            value={status}
            onChange={(event) =>
              changeParam(
                "status",
                event.target.value === "All" ? "" : event.target.value,
              )
            }
          >
            {[
              "All",
              "Submitted",
              "Reviewing",
              "Shortlisted",
              "Accepted",
              "Rejected",
              "Withdrawn",
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted" role="status">
        {filtered.length}{" "}
        {filtered.length === 1 ? "application" : "applications"}
        {status !== "All" ? ` · ${status}` : ""}
      </p>
      <DataBoundary
        empty={!filtered.length}
        emptyTitle={
          mine.length
            ? "No applications match these filters"
            : "Your next chapter starts with hello"
        }
        emptyDescription={
          mine.length
            ? "Try another status or clear your search."
            : "Find a Job that fits and send your first application."
        }
        action={
          mine.length ? (
            <Button variant="secondary" onClick={() => setParams({})}>
              Clear filters
            </Button>
          ) : (
            <ButtonLink to="/jobs">Explore Jobs</ButtonLink>
          )
        }
      >
        <Card>
          <div className="application-list">
            {filtered.slice((page - 1) * 6, page * 6).map((application) => (
              <ApplicationRow application={application} key={application.id} />
            ))}
          </div>
        </Card>
        <Pagination
          page={page}
          total={Math.ceil(filtered.length / 6)}
          onChange={(value) => changeParam("page", String(value))}
        />
      </DataBoundary>
    </div>
  );
}

export function ApplicationDetailPage() {
  const { applicationId } = useParams();
  const [params] = useSearchParams();
  const {
    applications,
    jobs,
    clients,
    freelancers,
    freelancerId,
    withdrawApplication,
  } = useMarketplace();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const application = applications.find(
    (item) => item.id === applicationId && item.freelancerId === freelancerId,
  );
  if (!application)
    return (
      <EmptyState
        title="Application not found"
        description="This application is unavailable in your workspace."
        action={
          <ButtonLink to="/freelancer/applications">My Applications</ButtonLink>
        }
      />
    );
  const job = jobs.find((item) => item.id === application.jobId);
  const client = clients.find((item) => item.id === job?.clientId);
  const profile = freelancers.find((item) => item.id === freelancerId)!;
  const withdrawable = ["Submitted", "Reviewing", "Shortlisted"].includes(
    application.status,
  );
  const statusCopy: Record<Application["status"], string> = {
    Submitted:
      "Your introduction is with the Client. You’ll find updates here when they review it.",
    Reviewing: "The Client is taking a closer look at your application.",
    Shortlisted:
      "You’re on the shortlist. The Client is considering your application closely.",
    Accepted:
      "You’ve been selected for this Job. Your next chapter is taking shape.",
    Rejected:
      "The Client moved forward with a different fit for this Job. There are more possibilities ahead.",
    Withdrawn:
      "You withdrew this application. The Client will no longer consider it for this Job.",
  };
  return (
    <div className="stack">
      <Link to="/freelancer/applications" className="text-link">
        ← My Applications
      </Link>
      <PageHeader
        eyebrow="YOUR APPLICATION"
        title={job?.title ?? "Unavailable Job"}
        description={`${client?.name ?? "Client"} · Submitted ${formatDate(application.submittedAt)}`}
        action={<Badge status={application.status} />}
      />
      {params.has("submitted") && application.status === "Submitted" && (
        <div className="application-success" role="status">
          <CheckCircle2 size={21} />
          <div>
            <strong>Application sent. A good beginning.</strong>
            <p>
              Your profile and selected work have been shared with{" "}
              {client?.name}.
            </p>
          </div>
        </div>
      )}
      <DataBoundary>
        <div className="split-layout">
          <div className="stack">
            <Card className="stack">
              <div className="application-status-heading">
                <Clock3 size={21} />
                <h2>
                  {application.status === "Accepted"
                    ? "A new opportunity awaits"
                    : "Where things stand"}
                </h2>
              </div>
              <p className="muted">{statusCopy[application.status]}</p>
              <ol className="application-timeline">
                <li className="completed">
                  <CheckCircle2 size={19} />
                  <span>
                    <strong>Application submitted</strong>
                    <small>{formatDate(application.submittedAt)}</small>
                  </span>
                </li>
                <li
                  className={
                    application.status !== "Submitted" ? "completed" : ""
                  }
                >
                  <span className="timeline-dot" />
                  <span>
                    <strong>
                      {application.status === "Withdrawn"
                        ? "Application withdrawn"
                        : application.status === "Rejected"
                          ? "Decision received"
                          : application.status === "Accepted"
                            ? "Application accepted"
                            : application.status === "Shortlisted"
                              ? "Shortlisted by Client"
                              : "Client review"}
                    </strong>
                    <small>
                      {application.status === "Submitted"
                        ? "Waiting for the Client’s review"
                        : "Latest application status"}
                    </small>
                  </span>
                </li>
              </ol>
            </Card>
            <Card className="stack">
              <h2>Your introduction</h2>
              <p className="prose">{application.coverLetter}</p>
              <div className="divider" />
              <div className="grid-2">
                <div>
                  <span className="muted">
                    Proposed{" "}
                    {job?.budgetType === "Hourly" ? "hourly rate" : "price"}
                  </span>
                  <h3>
                    {formatMoney(application.rate)}
                    {job?.budgetType === "Hourly" ? " / hr" : ""}
                  </h3>
                </div>
                <div>
                  <span className="muted">Estimated duration</span>
                  <h3>{application.duration}</h3>
                </div>
              </div>
            </Card>
            <Card className="stack">
              <h2>Work you shared</h2>
              {profile.portfolio
                .filter((item) => application.portfolioIds.includes(item.id))
                .map((item) => (
                  <a
                    className="application-portfolio-link"
                    href={item.url}
                    key={item.id}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <BriefcaseBusiness size={21} />
                    <span>
                      <strong>{item.title}</strong>
                      <small className="muted">{item.description}</small>
                    </span>
                    <ArrowRight size={18} />
                  </a>
                ))}
              {!application.portfolioIds.length && (
                <p className="muted">No portfolio items were included.</p>
              )}
              {application.attachmentName && (
                <p className="application-attachment">
                  <Paperclip size={17} />
                  {application.attachmentName}
                  <small className="muted">File name only</small>
                </p>
              )}
            </Card>
          </div>
          <aside className="stack">
            <Card className="stack">
              <div className="profile-identity">
                <Avatar name={client?.name ?? "Client"} />
                <div>
                  <h3>{client?.name}</h3>
                  <Link className="text-link" to={`/clients/${client?.id}`}>
                    View Client profile
                  </Link>
                </div>
              </div>
              <div className="divider" />
              <p className="muted">
                <CalendarDays size={16} /> Job status
              </p>
              <Badge status={job?.status ?? "Unavailable"} />
              <ButtonLink to={`/jobs/${job?.id}`} variant="secondary">
                View Job
                <ArrowRight size={16} />
              </ButtonLink>
            </Card>
            <AiMatchSummary match={application.match} />
            {withdrawable && (
              <Card className="stack">
                <h3>Plans changed?</h3>
                <p className="muted">
                  Withdraw if this opportunity is no longer the right fit for
                  you.
                </p>
                <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                  Withdraw Application
                </Button>
              </Card>
            )}
          </aside>
        </div>
      </DataBoundary>
      <ConfirmDialog
        open={confirmOpen}
        title="Withdraw your application?"
        description={`Your application for “${job?.title}” will no longer be considered. You cannot submit another application to this Job.`}
        confirmLabel="Withdraw Application"
        destructive
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          withdrawApplication(application.id);
          setConfirmOpen(false);
          toast.success("Application withdrawn.");
        }}
      />
    </div>
  );
}
