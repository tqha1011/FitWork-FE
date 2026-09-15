import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useMarketplace } from "../contexts/marketplaceContext";
import {
  categories,
  demoDate,
  jobs as seedJobs,
  skills as skillOptions,
} from "../data/mockData";
import type {
  Application,
  ApplicationStatus,
  Job,
  JobStatus,
} from "../types/marketplace";
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
  SkillChip,
} from "../components/ui";
import "../styles/client.css";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
const date = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const pendingStatuses: ApplicationStatus[] = [
  "Submitted",
  "Reviewing",
  "Shortlisted",
];
const pause = () =>
  new Promise<void>((resolve) => window.setTimeout(resolve, 450));

function ResourceUnavailable({ forbidden = false }: { forbidden?: boolean }) {
  return (
    <EmptyState
      title={
        forbidden
          ? "This workspace belongs to another Client"
          : "We couldn't find this page"
      }
      description={
        forbidden
          ? "Only the Client who owns this Job can manage it or review its applicants."
          : "This Job or Application may have been removed. Return to your Jobs to continue."
      }
      action={<ButtonLink to="/client/jobs">Back to My Jobs</ButtonLink>}
    />
  );
}

function OwnedJobRow({ job }: { job: Job }) {
  const { applications } = useMarketplace();
  const count = applications.filter(
    (application) => application.jobId === job.id,
  ).length;
  return (
    <article className="client-job-row">
      <div className="client-job-icon">
        <BriefcaseBusiness size={20} />
      </div>
      <div className="client-job-copy">
        <div className="client-inline">
          <Link
            className="client-job-title"
            to={`/client/jobs/${job.id}/manage`}
          >
            {job.title}
          </Link>
          <Badge status={job.status} />
        </div>
        <p className="muted">
          {job.category} <span aria-hidden="true">·</span>{" "}
          {money(job.budgetMin)}–{money(job.budgetMax)}
          {job.budgetType === "Hourly" ? "/hr" : " fixed price"}
        </p>
        <p className="client-small muted">
          {job.status === "Draft"
            ? "Not published yet"
            : `Posted ${date(job.postedAt)}`}{" "}
          <span aria-hidden="true">·</span> {job.duration}
        </p>
      </div>
      <Link
        className="client-applicant-count text-link"
        to={`/client/jobs/${job.id}/applicants`}
      >
        <Users size={16} />
        {count} {count === 1 ? "applicant" : "applicants"}
      </Link>
      <ButtonLink
        to={`/client/jobs/${job.id}/${job.status === "Draft" ? "edit" : "manage"}`}
        variant="secondary"
      >
        {job.status === "Draft" ? "Finish draft" : "Manage"}
        <ChevronRight size={16} />
      </ButtonLink>
    </article>
  );
}

export function ClientDashboard() {
  const { jobs, applications, clients, clientId, freelancers } =
    useMarketplace();
  const ownJobs = jobs.filter((job) => job.clientId === clientId);
  const ownApplications = applications.filter((application) =>
    ownJobs.some((job) => job.id === application.jobId),
  );
  const recent = ownApplications
    .filter((application) => pendingStatuses.includes(application.status))
    .slice(0, 3);
  const name =
    clients
      .find((client) => client.id === clientId)
      ?.contactName.split(" ")[0] ?? "there";
  return (
    <div className="stack client-page">
      <PageHeader
        eyebrow="YOUR CLIENT WORKSPACE"
        title={`Good to see you, ${name}.`}
        description="A little clarity on your Jobs, and the people moving them forward."
        action={
          <ButtonLink to="/client/jobs/new">
            <Plus size={18} />
            Create Job
          </ButtonLink>
        }
      />
      <DataBoundary>
        <div className="stats-grid">
          {[
            {
              label: "Active Jobs",
              value: ownJobs.filter((job) =>
                ["Open", "Reviewing"].includes(job.status),
              ).length,
              icon: BriefcaseBusiness,
              note: "Open and under review",
            },
            {
              label: "Applications to review",
              value: ownApplications.filter((application) =>
                pendingStatuses.includes(application.status),
              ).length,
              icon: Users,
              note: "Meet your next collaborator",
            },
            {
              label: "Draft Jobs",
              value: ownJobs.filter((job) => job.status === "Draft").length,
              icon: FileText,
              note: "Ready when you are",
            },
            {
              label: "Filled Jobs",
              value: ownJobs.filter((job) => job.status === "Filled").length,
              icon: Check,
              note: "A great collaboration ahead",
            },
          ].map(({ label, value, icon: Icon, note }) => (
            <Card className="stat-card" key={label}>
              <div className="client-stat-label">
                <span>{label}</span>
                <Icon size={18} />
              </div>
              <strong>{value}</strong>
              <p className="muted client-small">{note}</p>
            </Card>
          ))}
        </div>
        <section>
          <div className="section-heading">
            <div>
              <h2>Your active Jobs</h2>
              <p className="muted">Keep an eye on what needs your attention.</p>
            </div>
            <Link className="text-link" to="/client/jobs">
              View all Jobs <ArrowRight size={16} />
            </Link>
          </div>
          <div className="client-job-list">
            {ownJobs
              .filter((job) => ["Open", "Reviewing"].includes(job.status))
              .slice(0, 3)
              .map((job) => (
                <OwnedJobRow key={job.id} job={job} />
              ))}
            {!ownJobs.some((job) =>
              ["Open", "Reviewing"].includes(job.status),
            ) && (
              <EmptyState
                title="Your next Job starts here"
                description="Publish a clear brief to find the right independent talent."
                action={
                  <ButtonLink to="/client/jobs/new">Create Job</ButtonLink>
                }
              />
            )}
          </div>
        </section>
        <section>
          <div className="section-heading">
            <div>
              <h2>People to meet</h2>
              <p className="muted">
                Recent applications from independent talent.
              </p>
            </div>
            <Link className="text-link" to="/client/applicants">
              All applicants <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid-3">
            {recent.map((application) => {
              const person = freelancers.find(
                (freelancer) => freelancer.id === application.freelancerId,
              );
              const job = jobs.find((item) => item.id === application.jobId);
              return person && job ? (
                <Card key={application.id} className="client-recent-person">
                  <div className="client-inline">
                    <Avatar name={person.name} />
                    <div>
                      <h3>{person.name}</h3>
                      <p className="muted client-small">{person.title}</p>
                    </div>
                  </div>
                  <p className="client-small muted">
                    Applied to <span className="client-ink">{job.title}</span>
                  </p>
                  <div className="client-inline client-between">
                    <Badge status={application.status} />
                    <Link
                      className="text-link"
                      to={`/client/jobs/${job.id}/applicants/${application.id}`}
                    >
                      Review <ArrowRight size={16} />
                    </Link>
                  </div>
                </Card>
              ) : null;
            })}
          </div>
          {recent.length === 0 && (
            <EmptyState
              title="You're all caught up"
              description="New applications will appear here when Freelancers apply to your Jobs."
            />
          )}
        </section>
      </DataBoundary>
    </div>
  );
}

export function ClientJobsPage() {
  const { jobs, clientId } = useMarketplace();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "All";
  const query = params.get("q") ?? "";
  const ownJobs = jobs.filter((job) => job.clientId === clientId);
  const filtered = ownJobs.filter(
    (job) =>
      (status === "All" || job.status === status) &&
      job.title.toLowerCase().includes(query.toLowerCase()),
  );
  const rawPage = Number(params.get("page") ?? 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 5));
  const page = Number.isFinite(rawPage)
    ? Math.min(totalPages, Math.max(1, rawPage))
    : 1;
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next);
  };
  return (
    <div className="stack client-page">
      <PageHeader
        title="My Jobs"
        description="From first brief to your next collaboration. Manage it all here."
        action={
          <ButtonLink to="/client/jobs/new">
            <Plus size={18} />
            Create Job
          </ButtonLink>
        }
      />
      <div
        className="tabs client-status-tabs"
        aria-label="Filter Jobs by status"
      >
        {[
          "All",
          "Open",
          "Reviewing",
          "Draft",
          "Filled",
          "Closed",
          "Cancelled",
        ].map((value) => (
          <button
            type="button"
            key={value}
            className={`tab ${status === value ? "active" : ""}`}
            aria-pressed={status === value}
            onClick={() => setFilter("status", value)}
          >
            {value}{" "}
            <span>
              {
                ownJobs.filter((job) => value === "All" || job.status === value)
                  .length
              }
            </span>
          </button>
        ))}
      </div>
      <div className="client-inline client-between">
        <label className="client-search">
          <Search size={18} />
          <span className="sr-only">Search your Jobs</span>
          <input
            value={query}
            onChange={(event) => setFilter("q", event.target.value)}
            placeholder="Search your Jobs"
          />
        </label>
        <p className="muted client-small" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "Job" : "Jobs"}
        </p>
      </div>
      <DataBoundary
        empty={filtered.length === 0}
        emptyTitle={
          ownJobs.length
            ? "No Jobs match your filters"
            : "Make room for great work"
        }
        emptyDescription={
          ownJobs.length
            ? "Try another status or a different search."
            : "Create your first Job and tell Freelancers what you have in mind."
        }
        action={
          ownJobs.length ? (
            <Button variant="secondary" onClick={() => setParams({})}>
              Clear filters
            </Button>
          ) : (
            <ButtonLink to="/client/jobs/new">Create Job</ButtonLink>
          )
        }
      >
        <div className="client-job-list">
          {filtered.slice((page - 1) * 5, page * 5).map((job) => (
            <OwnedJobRow key={job.id} job={job} />
          ))}
        </div>
        <Pagination
          page={page}
          total={totalPages}
          onChange={(next) => {
            const value = new URLSearchParams(params);
            value.set("page", String(next));
            setParams(value);
          }}
        />
      </DataBoundary>
    </div>
  );
}

export function JobFormPage() {
  const { jobId } = useParams();
  const { jobs, clientId } = useMarketplace();
  const job = jobs.find((item) => item.id === jobId);
  if (jobId && !job) return <ResourceUnavailable />;
  if (job && job.clientId !== clientId)
    return <ResourceUnavailable forbidden />;
  if (job && ["Filled", "Closed", "Cancelled"].includes(job.status))
    return (
      <EmptyState
        title="This Job can no longer be edited"
        description={`This Job is ${job.status.toLowerCase()}. You can still view its details and applications.`}
        action={
          <ButtonLink to={`/client/jobs/${job.id}/manage`}>View Job</ButtonLink>
        }
      />
    );
  return <JobEditor key={jobId ?? "new"} existing={job} />;
}

function JobEditor({ existing }: { existing?: Job }) {
  const { clientId, saveJob, previewState } = useMarketplace();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({
    title: existing?.title ?? "",
    category: existing?.category ?? categories[0],
    description: existing?.description ?? "",
    deliverables: existing?.deliverables.join("\n") ?? "",
    skills: existing?.skills ?? [],
    experience: existing?.experience ?? "Intermediate",
    arrangement: existing?.arrangement ?? "Remote",
    budgetType: existing?.budgetType ?? "Fixed price",
    budgetMin: existing ? String(existing.budgetMin) : "",
    budgetMax: existing ? String(existing.budgetMax) : "",
    duration: existing?.duration ?? "4–6 weeks",
    deadline: existing?.deadline ?? "2026-10-15",
  }));
  const [step, setStep] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [discard, setDiscard] = useState(false);
  const leaving = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const steps = [
    "Overview",
    "Scope and requirements",
    "Skills and experience",
    "Budget and timeline",
    "Review and publish",
  ];
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty && !leaving.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const click = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest("a[href]");
      if (
        dirty &&
        !leaving.current &&
        link &&
        !window.confirm("Leave this Job without saving your changes?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setErrors((current) => ({ ...current, [key]: "", submit: "" }));
  };
  const validate = (scope?: number) => {
    const next: Record<string, string> = {};
    if ((scope === undefined || scope === 0) && form.title.trim().length < 10)
      next.title = "Use at least 10 characters to describe the work clearly.";
    if (scope === undefined || scope === 1) {
      if (form.description.trim().length < 50)
        next.description =
          "Add at least 50 characters about the work and your expectations.";
      if (!form.deliverables.trim())
        next.deliverables = "Add at least one deliverable.";
    }
    if ((scope === undefined || scope === 2) && !form.skills.length)
      next.skills = "Choose at least one relevant skill.";
    if (scope === undefined || scope === 3) {
      if (!form.budgetMin || Number(form.budgetMin) <= 0)
        next.budgetMin = "Enter a budget greater than zero.";
      if (!form.budgetMax || Number(form.budgetMax) < Number(form.budgetMin))
        next.budgetMax = "Maximum budget must be at least the minimum.";
      if (!form.deadline || form.deadline <= demoDate)
        next.deadline = "Choose a future Application deadline.";
    }
    setErrors(next);
    return next;
  };
  const goStep = (next: number) => {
    setStep(next);
    window.setTimeout(() => headingRef.current?.focus(), 0);
  };
  const submit = async (status: JobStatus) => {
    if (pending) return;
    const invalid =
      status === "Draft"
        ? form.title.trim()
          ? {}
          : { title: "Give your draft a title." }
        : validate();
    if (Object.keys(invalid).length) {
      setErrors(invalid);
      goStep(
        "title" in invalid
          ? 0
          : "description" in invalid || "deliverables" in invalid
            ? 1
            : "skills" in invalid
              ? 2
              : 3,
      );
      return;
    }
    setPending(true);
    try {
      await pause();
      if (previewState === "error")
        throw new Error(
          "We couldn't save this Job. Your changes are still here. Please try again.",
        );
      const job: Job = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        id: existing?.id ?? crypto.randomUUID(),
        clientId,
        deliverables: form.deliverables
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
        postedAt: existing?.postedAt ?? demoDate,
        status,
        match: existing?.match ?? seedJobs[0].match,
      };
      saveJob(job);
      leaving.current = true;
      setDirty(false);
      navigate(`/client/jobs/${job.id}/manage`);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        submit:
          error instanceof Error
            ? error.message
            : "Unable to save. Please try again.",
      }));
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="stack client-page">
      <PageHeader
        eyebrow={existing ? "MY JOBS / EDIT JOB" : "MY JOBS / CREATE JOB"}
        title={
          existing
            ? "Make your brief even better"
            : "Great work starts with a clear brief"
        }
        description="Tell the right people what you're building, and how they can help."
      />
      <div className="client-editor-layout">
        <nav className="client-steps" aria-label="Job form steps">
          {steps.map((label, index) => (
            <button
              type="button"
              key={label}
              aria-current={step === index ? "step" : undefined}
              className={step === index ? "active" : ""}
              onClick={() =>
                index < step || !Object.keys(validate(step)).length
                  ? goStep(index)
                  : undefined
              }
            >
              <span>{index < step ? <Check size={15} /> : index + 1}</span>
              {label}
            </button>
          ))}
          <p className="muted client-small">
            Your Job is only visible to Freelancers when you publish it.
          </p>
        </nav>
        <Card className="client-editor-card">
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (step < 4) {
                if (!Object.keys(validate(step)).length) goStep(step + 1);
              } else
                void submit(
                  existing && existing.status !== "Draft"
                    ? existing.status
                    : "Open",
                );
            }}
          >
            <p className="client-small muted">STEP {step + 1} OF 5</p>
            <h2 tabIndex={-1} ref={headingRef}>
              {steps[step]}
            </h2>
            {step === 0 && (
              <div className="stack">
                <p className="muted">
                  A specific title helps the right Freelancers find your Job.
                </p>
                <Field
                  label="Job title"
                  error={errors.title}
                  hint="For example: Design an accessible wellness app"
                >
                  <input
                    value={form.title}
                    maxLength={120}
                    onChange={(event) => update("title", event.target.value)}
                    placeholder="What do you need help with?"
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={(event) => update("category", event.target.value)}
                  >
                    {categories.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
            {step === 1 && (
              <div className="stack">
                <p className="muted">
                  Share the context, the goals, and what a successful handover
                  looks like.
                </p>
                <Field label="Job description" error={errors.description}>
                  <textarea
                    rows={7}
                    value={form.description}
                    onChange={(event) =>
                      update("description", event.target.value)
                    }
                    placeholder="Tell us about the work, your team, and what you hope to achieve."
                  />
                </Field>
                <Field
                  label="Deliverables"
                  error={errors.deliverables}
                  hint="Add one deliverable per line."
                >
                  <textarea
                    rows={4}
                    value={form.deliverables}
                    onChange={(event) =>
                      update("deliverables", event.target.value)
                    }
                    placeholder="An interactive prototype\nA documented design system"
                  />
                </Field>
              </div>
            )}
            {step === 2 && (
              <div className="stack">
                <fieldset className="client-skills-field">
                  <legend>Required skills</legend>
                  <p className="muted client-small">
                    Choose the skills that matter most to this Job.
                  </p>
                  <div className="client-skill-options">
                    {skillOptions.map((skill) => (
                      <label
                        key={skill}
                        className={
                          form.skills.includes(skill) ? "selected" : ""
                        }
                      >
                        <input
                          type="checkbox"
                          checked={form.skills.includes(skill)}
                          onChange={() =>
                            update(
                              "skills",
                              form.skills.includes(skill)
                                ? form.skills.filter((item) => item !== skill)
                                : [...form.skills, skill],
                            )
                          }
                        />
                        {skill}
                      </label>
                    ))}
                  </div>
                  {errors.skills && (
                    <p className="client-error" role="alert">
                      {errors.skills}
                    </p>
                  )}
                </fieldset>
                <Field label="Experience level">
                  <select
                    value={form.experience}
                    onChange={(event) =>
                      update("experience", event.target.value)
                    }
                  >
                    {["Entry level", "Intermediate", "Expert"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Work arrangement">
                  <select
                    value={form.arrangement}
                    onChange={(event) =>
                      update("arrangement", event.target.value)
                    }
                  >
                    {["Remote", "Hybrid", "On-site"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
            {step === 3 && (
              <div className="stack">
                <Field label="Budget type">
                  <select
                    value={form.budgetType}
                    onChange={(event) =>
                      update(
                        "budgetType",
                        event.target.value as Job["budgetType"],
                      )
                    }
                  >
                    <option>Fixed price</option>
                    <option>Hourly</option>
                  </select>
                </Field>
                <div className="form-grid">
                  <Field
                    label={`Minimum budget (USD${form.budgetType === "Hourly" ? "/hr" : ""})`}
                    error={errors.budgetMin}
                  >
                    <input
                      type="number"
                      min="1"
                      value={form.budgetMin}
                      onChange={(event) =>
                        update("budgetMin", event.target.value)
                      }
                      placeholder="2,000"
                    />
                  </Field>
                  <Field
                    label={`Maximum budget (USD${form.budgetType === "Hourly" ? "/hr" : ""})`}
                    error={errors.budgetMax}
                  >
                    <input
                      type="number"
                      min="1"
                      value={form.budgetMax}
                      onChange={(event) =>
                        update("budgetMax", event.target.value)
                      }
                      placeholder="5,000"
                    />
                  </Field>
                </div>
                <Field label="Estimated duration">
                  <select
                    value={form.duration}
                    onChange={(event) => update("duration", event.target.value)}
                  >
                    {[
                      "Less than 1 week",
                      "1–2 weeks",
                      "4–6 weeks",
                      "1–3 months",
                      "3–6 months",
                      "Ongoing",
                    ].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Application deadline" error={errors.deadline}>
                  <input
                    type="date"
                    min={demoDate}
                    value={form.deadline}
                    onChange={(event) => update("deadline", event.target.value)}
                  />
                </Field>
              </div>
            )}
            {step === 4 && (
              <div className="stack">
                <p className="muted">
                  Take a moment to check your brief before sharing it.
                </p>
                <div className="client-review">
                  <p className="muted client-small">{form.category}</p>
                  <h3>{form.title}</h3>
                  <p className="prose">{form.description}</p>
                  <h4>Deliverables</h4>
                  <ul>
                    {form.deliverables
                      .split("\n")
                      .filter(Boolean)
                      .map((value, index) => (
                        <li key={index}>{value}</li>
                      ))}
                  </ul>
                  <div className="client-inline">
                    {form.skills.map((skill) => (
                      <SkillChip key={skill}>{skill}</SkillChip>
                    ))}
                  </div>
                  <dl className="client-facts">
                    <div>
                      <dt>Budget</dt>
                      <dd>
                        {money(Number(form.budgetMin))}–
                        {money(Number(form.budgetMax))}{" "}
                        {form.budgetType === "Hourly" ? "/hr" : "fixed price"}
                      </dd>
                    </div>
                    <div>
                      <dt>Duration</dt>
                      <dd>{form.duration}</dd>
                    </div>
                    <div>
                      <dt>Experience</dt>
                      <dd>{form.experience}</dd>
                    </div>
                    <div>
                      <dt>Work arrangement</dt>
                      <dd>{form.arrangement}</dd>
                    </div>
                    <div>
                      <dt>Apply by</dt>
                      <dd>{date(form.deadline)}</dd>
                    </div>
                  </dl>
                </div>
                <p className="muted client-small">
                  Publishing makes this Job visible to Freelancers. You can edit
                  your brief while the Job is open.
                </p>
              </div>
            )}
            {errors.submit && (
              <p className="client-error" role="alert">
                {errors.submit}
              </p>
            )}
            <div className="client-editor-footer">
              <div className="actions">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={() =>
                    dirty ? setDiscard(true) : navigate("/client/jobs")
                  }
                >
                  Cancel
                </Button>
                {(!existing || existing.status === "Draft") && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => void submit("Draft")}
                  >
                    {pending ? "Saving…" : "Save draft"}
                  </Button>
                )}
              </div>
              <div className="actions">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => goStep(step - 1)}
                  >
                    Back
                  </Button>
                )}
                <Button type="submit" disabled={pending}>
                  {pending
                    ? "Saving…"
                    : step < 4
                      ? "Continue"
                      : existing && existing.status !== "Draft"
                        ? "Save changes"
                        : "Publish Job"}
                  {!pending && step < 4 && <ArrowRight size={16} />}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
      <ConfirmDialog
        open={discard}
        title="Discard your unsaved changes?"
        description={`Your changes to ${form.title ? `“${form.title}”` : "this Job"} haven't been saved. Leaving now will discard them.`}
        confirmLabel="Discard changes"
        destructive
        onClose={() => setDiscard(false)}
        onConfirm={() => {
          leaving.current = true;
          navigate("/client/jobs");
        }}
      />
    </div>
  );
}

export function ManageJobPage() {
  const { jobId } = useParams();
  const { jobs, applications, freelancers, clientId, setJobStatus } =
    useMarketplace();
  const [action, setAction] = useState<"Closed" | "Cancelled" | null>(null);
  const job = jobs.find((item) => item.id === jobId);
  if (!job) return <ResourceUnavailable />;
  if (job.clientId !== clientId) return <ResourceUnavailable forbidden />;
  const applicants = applications.filter(
    (application) => application.jobId === job.id,
  );
  const selected = applicants.find(
    (application) => application.status === "Accepted",
  );
  const person = freelancers.find(
    (freelancer) => freelancer.id === selected?.freelancerId,
  );
  const editable = ["Open", "Reviewing", "Draft"].includes(job.status);
  return (
    <div className="stack client-page">
      <Link className="text-link client-small" to="/client/jobs">
        My Jobs / Manage Job
      </Link>
      <PageHeader
        title={job.title}
        description={`Created ${date(job.postedAt)} · ${job.category}`}
        action={
          <ButtonLink
            to={`/client/jobs/${job.id}/${job.status === "Draft" ? "edit" : "applicants"}`}
          >
            {job.status === "Draft"
              ? "Finish and publish"
              : `Review ${applicants.length} applicants`}
          </ButtonLink>
        }
      />
      <DataBoundary>
        <div className="client-inline">
          <Badge status={job.status} />
          <span className="muted client-small">
            {job.status === "Open"
              ? "Freelancers can apply to this Job."
              : job.status === "Draft"
                ? "Only you can see this draft."
                : "This Job is no longer accepting new Applications."}
          </span>
        </div>
        {selected && person && (
          <div className="client-success" role="status">
            <Check size={22} />
            <div>
              <strong>{person.name} is your selected Freelancer</strong>
              <p>
                Only one Freelancer can be selected. Other pending Applications
                have been marked as rejected.
              </p>
              <Link
                className="text-link"
                to={`/client/jobs/${job.id}/applicants/${selected.id}`}
              >
                View accepted Application
              </Link>
            </div>
          </div>
        )}
        <div className="split-layout">
          <Card>
            <div className="section-heading">
              <h2>Job overview</h2>
              {editable && (
                <Link className="text-link" to={`/client/jobs/${job.id}/edit`}>
                  Edit Job
                </Link>
              )}
            </div>
            <p className="prose">
              {job.description ||
                "Add a description before publishing this Job."}
            </p>
            <h3 className="client-subheading">Deliverables</h3>
            <ul className="client-deliverables">
              {job.deliverables.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ul>
            <h3 className="client-subheading">Skills and experience</h3>
            <div className="client-inline">
              {job.skills.map((skill) => (
                <SkillChip key={skill}>{skill}</SkillChip>
              ))}
            </div>
            <p className="muted client-small client-subheading">
              {job.experience} · {job.arrangement}
            </p>
          </Card>
          <div className="stack">
            <Card>
              <h2>Budget and timeline</h2>
              <p className="client-budget">
                {money(job.budgetMin)}–{money(job.budgetMax)}
              </p>
              <p className="muted">
                {job.budgetType === "Hourly"
                  ? "Per hour · USD"
                  : "Fixed price · USD"}
              </p>
              <dl className="client-facts">
                <div>
                  <dt>Duration</dt>
                  <dd>{job.duration}</dd>
                </div>
                <div>
                  <dt>Application deadline</dt>
                  <dd>{date(job.deadline)}</dd>
                </div>
                <div>
                  <dt>Applications</dt>
                  <dd>{applicants.length}</dd>
                </div>
              </dl>
              {job.status !== "Draft" && (
                <ButtonLink variant="secondary" to={`/jobs/${job.id}`}>
                  View public Job <ArrowRight size={16} />
                </ButtonLink>
              )}
            </Card>
            {editable && (
              <Card>
                <h3>Job controls</h3>
                <p className="muted client-small">
                  Closing stops new Applications. Cancelling ends the Job
                  without selecting a Freelancer.
                </p>
                <div className="stack client-subheading">
                  {job.status !== "Draft" && (
                    <Button
                      variant="danger"
                      onClick={() => setAction("Closed")}
                    >
                      Close Job
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    onClick={() => setAction("Cancelled")}
                  >
                    Cancel Job
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </DataBoundary>
      <ConfirmDialog
        open={action !== null}
        title={`${action === "Closed" ? "Close" : "Cancel"} “${job.title}”?`}
        description={
          action === "Closed"
            ? "New Applications will no longer be accepted, and selection actions will be disabled. Existing Applications remain available for your records."
            : "This Job will be cancelled. Freelancers will no longer be able to apply, and you won't be able to select a Freelancer for it."
        }
        confirmLabel={action === "Closed" ? "Close Job" : "Cancel Job"}
        destructive
        onClose={() => setAction(null)}
        onConfirm={async () => {
          await pause();
          if (action) setJobStatus(job.id, action);
          setAction(null);
        }}
      />
    </div>
  );
}

export function ApplicantsPage() {
  const { jobId } = useParams();
  const { jobs, applications, freelancers, clientId } = useMarketplace();
  const [params, setParams] = useSearchParams();
  const job = jobs.find((item) => item.id === jobId);
  const ownJobs = jobs.filter((item) => item.clientId === clientId);
  const status = params.get("status") ?? "All";
  const match = params.get("match") ?? "All";
  const sort = params.get("sort") ?? "newest";
  const query = params.get("q") ?? "";
  const filterJob = jobId ?? params.get("job") ?? "All";
  const ownApplications = applications.filter(
    (application) =>
      ownJobs.some((item) => item.id === application.jobId) &&
      (!jobId || application.jobId === jobId),
  );
  const filtered = ownApplications
    .filter((application) => {
      const person = freelancers.find(
        (item) => item.id === application.freelancerId,
      );
      return (
        (status === "All" || status === application.status) &&
        (match === "All" || match === application.match.label) &&
        (filterJob === "All" || application.jobId === filterJob) &&
        `${person?.name} ${person?.title}`
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    })
    .sort((a, b) =>
      sort === "rate-low"
        ? a.rate - b.rate
        : sort === "rate-high"
          ? b.rate - a.rate
          : sort === "match"
            ? b.match.percentage - a.match.percentage
            : b.submittedAt.localeCompare(a.submittedAt),
    );
  const totalPages = Math.max(1, Math.ceil(filtered.length / 5));
  const rawPage = Number(params.get("page") ?? 1);
  const page = Number.isFinite(rawPage)
    ? Math.min(totalPages, Math.max(1, rawPage))
    : 1;
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next);
  };
  if (jobId && !job) return <ResourceUnavailable />;
  if (job && job.clientId !== clientId)
    return <ResourceUnavailable forbidden />;
  return (
    <div className="stack client-page">
      {job && (
        <Link
          className="text-link client-small"
          to={`/client/jobs/${job.id}/manage`}
        >
          My Jobs / {job.title} / Applicants
        </Link>
      )}
      <PageHeader
        title={job ? "Job applicants" : "Meet your next collaborator"}
        description={
          job
            ? job.title
            : "Review the people, experience, and ideas behind every Application."
        }
        action={job ? <Badge status={job.status} /> : undefined}
      />
      <div
        className="tabs client-status-tabs"
        aria-label="Filter applicants by status"
      >
        {[
          "All",
          "Submitted",
          "Reviewing",
          "Shortlisted",
          "Accepted",
          "Rejected",
          "Withdrawn",
        ].map((value) => (
          <button
            type="button"
            key={value}
            className={`tab ${status === value ? "active" : ""}`}
            aria-pressed={status === value}
            onClick={() => update("status", value)}
          >
            {value}
            <span>
              {
                ownApplications.filter(
                  (application) =>
                    value === "All" || application.status === value,
                ).length
              }
            </span>
          </button>
        ))}
      </div>
      <div className="client-applicant-filters">
        <Field label="Search applicants">
          <div className="client-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => update("q", event.target.value)}
              placeholder="Name or professional title"
            />
          </div>
        </Field>
        {!jobId && (
          <Field label="Job">
            <select
              value={filterJob}
              onChange={(event) => update("job", event.target.value)}
            >
              <option value="All">All your Jobs</option>
              {ownJobs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="AI Match">
          <select
            value={match}
            onChange={(event) => update("match", event.target.value)}
          >
            {["All", "Strong", "Potential", "Limited"].map((value) => (
              <option key={value} value={value}>
                {value === "All" ? "All matches" : `${value} Match`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sort by">
          <select
            value={sort}
            onChange={(event) => update("sort", event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="rate-low">Rate: low to high</option>
            <option value="rate-high">Rate: high to low</option>
            <option value="match">AI Match</option>
          </select>
        </Field>
      </div>
      <div className="client-inline client-between">
        <p className="muted client-small" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "applicant" : "applicants"}
        </p>
        {params.size > 0 && (
          <Button variant="ghost" onClick={() => setParams({})}>
            Clear filters
          </Button>
        )}
      </div>
      <DataBoundary
        empty={filtered.length === 0}
        emptyTitle={
          ownApplications.length
            ? "No applicants match these filters"
            : "The right people will appear here"
        }
        emptyDescription={
          ownApplications.length
            ? "Try a different status, skill match, or search."
            : "When Freelancers apply to your open Jobs, you can review their experience and ideas here."
        }
        action={
          ownApplications.length ? (
            <Button variant="secondary" onClick={() => setParams({})}>
              Clear filters
            </Button>
          ) : (
            <ButtonLink
              variant="secondary"
              to={job ? `/client/jobs/${job.id}/manage` : "/client/jobs"}
            >
              View your Jobs
            </ButtonLink>
          )
        }
      >
        <div className="client-applicant-list">
          {filtered.slice((page - 1) * 5, page * 5).map((application) => (
            <ApplicantRow
              key={application.id}
              application={application}
              showJob={!jobId}
            />
          ))}
        </div>
        <Pagination
          page={page}
          total={totalPages}
          onChange={(next) => {
            const value = new URLSearchParams(params);
            value.set("page", String(next));
            setParams(value);
          }}
        />
      </DataBoundary>
    </div>
  );
}

function ApplicantRow({
  application,
  showJob,
}: {
  application: Application;
  showJob: boolean;
}) {
  const { jobs, freelancers, decideApplication } = useMarketplace();
  const [pending, setPending] = useState(false);
  const job = jobs.find((item) => item.id === application.jobId);
  const person = freelancers.find(
    (item) => item.id === application.freelancerId,
  );
  if (!job || !person) return null;
  const canShortlist =
    ["Open", "Reviewing"].includes(job.status) &&
    ["Submitted", "Reviewing"].includes(application.status);
  return (
    <Card className="client-applicant-row">
      <div className="client-applicant-main">
        <div className="client-inline">
          <Avatar name={person.name} />
          <div>
            <Link
              className="client-job-title"
              to={`/client/jobs/${job.id}/applicants/${application.id}`}
            >
              {person.name}
            </Link>
            <p className="muted client-small">{person.title}</p>
          </div>
        </div>
        {showJob && (
          <p className="client-small muted">
            For{" "}
            <Link
              className="text-link"
              to={`/client/jobs/${job.id}/applicants`}
            >
              {job.title}
            </Link>
          </p>
        )}
        <div className="client-inline">
          {person.skills.slice(0, 4).map((skill) => (
            <SkillChip key={skill}>{skill}</SkillChip>
          ))}
        </div>
        <p className="muted client-small">
          {person.experience[0]
            ? `${person.experience[0].title} at ${person.experience[0].company} · ${person.experience[0].years}`
            : "Work experience not provided"}
        </p>
        <p className="muted client-small">
          {application.portfolioIds.length} portfolio{" "}
          {application.portfolioIds.length === 1 ? "item" : "items"} shared ·
          Submitted {date(application.submittedAt)}
        </p>
      </div>
      <div className="client-applicant-terms">
        <strong>
          {money(application.rate)}
          <span className="muted client-small">
            {job.budgetType === "Hourly" ? " /hr" : " fixed"}
          </span>
        </strong>
        <p className="muted client-small">{application.duration}</p>
        <Badge status={application.status} />
        <AiMatchSummary match={application.match} compact />
      </div>
      <div className="client-applicant-actions">
        <ButtonLink
          to={`/client/jobs/${job.id}/applicants/${application.id}`}
          variant="secondary"
        >
          Review Application <ArrowRight size={16} />
        </ButtonLink>
        {canShortlist && (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={async () => {
              if (pending) return;
              setPending(true);
              await pause();
              decideApplication(application.id, "Shortlisted");
              setPending(false);
            }}
          >
            {pending ? "Shortlisting…" : "Shortlist"}
          </Button>
        )}
      </div>
    </Card>
  );
}

export function ApplicantDetailPage() {
  const { jobId, applicationId } = useParams();
  const { jobs, applications, freelancers, clientId, decideApplication } =
    useMarketplace();
  const [decision, setDecision] = useState<"Accepted" | "Rejected" | null>(
    null,
  );
  const [shortlisting, setShortlisting] = useState(false);
  const job = jobs.find((item) => item.id === jobId);
  const application = applications.find(
    (item) => item.id === applicationId && item.jobId === jobId,
  );
  const person = freelancers.find(
    (item) => item.id === application?.freelancerId,
  );
  if (!job) return <ResourceUnavailable />;
  if (job.clientId !== clientId) return <ResourceUnavailable forbidden />;
  if (!application || !person) return <ResourceUnavailable />;
  const eligible =
    ["Open", "Reviewing"].includes(job.status) &&
    pendingStatuses.includes(application.status);
  const portfolio = person.portfolio.filter((item) =>
    application.portfolioIds.includes(item.id),
  );
  return (
    <div className="stack client-page">
      <Link
        className="text-link client-small"
        to={`/client/jobs/${job.id}/applicants`}
      >
        Job applicants / {job.title}
      </Link>
      <PageHeader
        title="A closer look at your applicant"
        description={job.title}
        action={<Badge status={job.status} />}
      />
      <DataBoundary>
        <Card className="client-candidate-heading">
          <div className="client-inline">
            <Avatar name={person.name} size="large" />
            <div>
              <div className="client-inline">
                <h2>{person.name}</h2>
                <Badge status={application.status} />
              </div>
              <p>{person.title}</p>
              <p className="muted client-small">
                {person.location} · Applied {date(application.submittedAt)}
              </p>
            </div>
          </div>
          <ButtonLink to={`/freelancers/${person.id}`} variant="secondary">
            View full profile <ArrowRight size={16} />
          </ButtonLink>
        </Card>
        <div className="split-layout">
          <div className="stack">
            <Card>
              <h2>A note from {person.name.split(" ")[0]}</h2>
              <p className="prose client-subheading">
                {application.coverLetter}
              </p>
              {application.attachmentName && (
                <p className="client-attachment">
                  <FileText size={18} />
                  {application.attachmentName}{" "}
                  <span className="muted client-small">
                    Attachment name saved in this demo
                  </span>
                </p>
              )}
            </Card>
            <Card>
              <h2>Relevant skills</h2>
              <div className="client-inline client-subheading">
                {person.skills.map((skill) => (
                  <SkillChip key={skill}>{skill}</SkillChip>
                ))}
              </div>
              <h2 className="client-subheading">Work experience</h2>
              {person.experience.length ? (
                person.experience.map((experience) => (
                  <div className="client-experience" key={experience.id}>
                    <BriefcaseBusiness size={19} />
                    <div>
                      <h3>{experience.title}</h3>
                      <p className="muted client-small">
                        {experience.company} · {experience.years}
                      </p>
                      <p>{experience.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted client-subheading">
                  No work experience has been added to this profile. Ask the
                  Freelancer about relevant past work before deciding.
                </p>
              )}
            </Card>
            <Card>
              <div className="section-heading">
                <h2>Selected portfolio</h2>
                <span className="muted client-small">
                  {portfolio.length} shared
                </span>
              </div>
              {portfolio.length ? (
                <div className="grid-2">
                  {portfolio.map((item, index) => (
                    <a
                      className="client-portfolio"
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      key={item.id}
                    >
                      <div
                        className={`client-portfolio-art client-portfolio-art-${index % 2}`}
                        aria-hidden="true"
                      >
                        <div />
                        <div />
                        <div />
                      </div>
                      <h3>
                        {item.title} <ArrowRight size={16} />
                      </h3>
                      <p className="muted client-small">{item.description}</p>
                      <span className="text-link client-small">
                        Open portfolio{" "}
                        <span className="sr-only">in a new tab</span>
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="muted">
                  No portfolio items were shared with this Application. You can
                  review the Freelancer's profile for more context.
                </p>
              )}
            </Card>
            <AiMatchSummary match={application.match} />
            <Card className="client-decision">
              <h2>
                {application.status === "Accepted"
                  ? "You've found your collaborator"
                  : "Your decision, with the full picture"}
              </h2>
              <p className="muted">
                {eligible
                  ? "Consider the cover letter, experience, portfolio, and proposed terms together. AI Match is one supporting perspective."
                  : application.status === "Accepted"
                    ? `${person.name} is selected for this Job. The Job is now filled, and other pending Applications have been rejected.`
                    : `This Application is ${application.status.toLowerCase()} and the Job is ${job.status.toLowerCase()}. Selection actions are unavailable.`}
              </p>
              {eligible && (
                <>
                  <div className="actions client-subheading">
                    <Button onClick={() => setDecision("Accepted")}>
                      Accept Freelancer <Check size={17} />
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={
                        shortlisting || application.status === "Shortlisted"
                      }
                      onClick={async () => {
                        if (shortlisting) return;
                        setShortlisting(true);
                        await pause();
                        decideApplication(application.id, "Shortlisted");
                        setShortlisting(false);
                      }}
                    >
                      {shortlisting
                        ? "Shortlisting…"
                        : application.status === "Shortlisted"
                          ? "Shortlisted"
                          : "Shortlist applicant"}
                    </Button>
                  </div>
                  <div className="client-reject">
                    <span className="muted client-small">
                      Not the right fit for this Job?
                    </span>
                    <Button
                      variant="danger"
                      onClick={() => setDecision("Rejected")}
                    >
                      Reject Application
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
          <aside className="stack">
            <Card>
              <h2>Proposed terms</h2>
              <p className="client-budget">
                {money(application.rate)}
                {job.budgetType === "Hourly" && (
                  <span className="muted"> /hr</span>
                )}
              </p>
              <p className="muted client-small">
                {job.budgetType === "Hourly"
                  ? "Proposed hourly rate"
                  : "Proposed total price"}{" "}
                · USD
              </p>
              <dl className="client-facts">
                <div>
                  <dt>
                    <Clock3 size={15} />
                    Estimated duration
                  </dt>
                  <dd>{application.duration}</dd>
                </div>
                <div>
                  <dt>Job budget</dt>
                  <dd>
                    {money(job.budgetMin)}–{money(job.budgetMax)}
                    {job.budgetType === "Hourly" ? "/hr" : " fixed"}
                  </dd>
                </div>
                <div>
                  <dt>Availability</dt>
                  <dd>
                    {person.available
                      ? "Available for work"
                      : "Not currently available"}
                  </dd>
                </div>
              </dl>
              <p className="muted client-small">
                Confirm scope and final terms with the Freelancer before
                starting work.
              </p>
            </Card>
            <Card>
              <h3>A thoughtful review goes further</h3>
              <p className="muted client-small">
                Look for evidence of the skills your Job needs. Missing profile
                information is a good starting point for a conversation.
              </p>
            </Card>
          </aside>
        </div>
      </DataBoundary>
      <ConfirmDialog
        open={decision !== null}
        title={
          decision === "Accepted"
            ? `Accept ${person.name}?`
            : `Reject ${person.name}'s Application?`
        }
        description={
          decision === "Accepted"
            ? `You're selecting ${person.name} for “${job.title}”. Only one Freelancer may be selected. This fills the Job and rejects other pending Applications. Review the Application and proposed terms before confirming.`
            : `${person.name} will no longer be considered for “${job.title}”. This decision cannot be undone.`
        }
        confirmLabel={
          decision === "Accepted"
            ? `Accept ${person.name}`
            : "Reject Application"
        }
        destructive={decision === "Rejected"}
        onClose={() => setDecision(null)}
        onConfirm={async () => {
          await pause();
          if (decision) decideApplication(application.id, decision);
          setDecision(null);
        }}
      />
    </div>
  );
}
