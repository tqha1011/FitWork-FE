import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { isCancel } from "axios";
import { useAuth } from "../contexts/authContext";
import { useJobs } from "../contexts/jobContext";
import { searchJobs } from "../services/jobService";
import { jobErrorMessage } from "../shared/jobErrorMessage";
import {
  isJobExpired,
  parseJobFilters,
  serializeJobFilters,
} from "../shared/jobValidation";
import type { JobFilters, JobItem, PageResult } from "../types/job";
import { Button, ButtonLink, PageHeader } from "../components/ui";
import {
  JobError,
  JobField,
  JobPagination,
  ReferenceChoices,
} from "../components/JobUi";
import { formatJobAmount, formatJobDate } from "../shared/jobFormatters";
import ApplyJobDialog from "../components/ApplyJobDialog";

export default function JobsPage() {
  const { session } = useAuth();
  const jobs = useJobs();
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const { filters, error: filterError } = parseJobFilters(params);
  const [retry, setRetry] = useState(0);
  const key = `${query}:${jobs.searchVersion}:${retry}`;
  const [result, setResult] = useState<{
    key: string;
    page?: PageResult<JobItem>;
    error?: string;
  }>();
  const [selectedJob, setSelectedJob] = useState<JobItem>();
  const titleRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [now, setNow] = useState(Date.now);
  const { rememberJobs } = jobs;
  useEffect(() => {
    if (titleRef.current)
      titleRef.current.value = new URLSearchParams(query).get("title") ?? "";
    clearTimeout(debounce.current);
    return () => clearTimeout(debounce.current);
  }, [query]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const parsed = parseJobFilters(new URLSearchParams(query));
    if (parsed.error) return;
    void searchJobs(parsed.filters, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;
        rememberJobs(page.items);
        setResult({ key, page });
      })
      .catch((error) => {
        if (!controller.signal.aborted && !isCancel(error))
          setResult({ key, error: jobErrorMessage(error) });
      });
    return () => controller.abort();
  }, [query, key, rememberJobs]);
  function updateFilters(patch: Partial<JobFilters>) {
    clearTimeout(debounce.current);
    // Preserve a title being typed when another filter is changed.
    setParams(
      serializeJobFilters({
        ...filters,
        title: titleRef.current?.value,
        ...patch,
        pageNumber: 1,
      }),
    );
  }
  function titleChanged(value: string) {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(
      () =>
        setParams((previous) =>
          serializeJobFilters({
            ...parseJobFilters(previous).filters,
            title: value,
            pageNumber: 1,
          }),
        ),
      300,
    );
  }
  function budgetSubmitted(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearTimeout(debounce.current);
    const form = new FormData(event.currentTarget);
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const name of ["budgetMin", "budgetMax"]) {
        const value = String(form.get(name) ?? "").trim();
        if (value) next.set(name, value);
        else next.delete(name);
      }
      const title = titleRef.current?.value.trim();
      if (title) next.set("title", title);
      else next.delete("title");
      next.delete("pageNumber");
      return next;
    });
  }
  const current = result?.key === key ? result : undefined;
  const freelancer = session?.user.role === "freelancer";
  return (
    <>
      <PageHeader
        eyebrow="Opportunities"
        title={freelancer ? "Find your next Job" : "Browse Jobs"}
        description="Explore open work and find a scope that fits."
        action={
          !freelancer && <ButtonLink to="/client/jobs/new">Post Job</ButtonLink>
        }
      />
      <div className="job-search-layout">
        <aside className="panel job-filters" aria-label="Job filters">
          <div className="section-heading">
            <h2>Filters</h2>
            <Button
              variant="ghost"
              onClick={() => {
                clearTimeout(debounce.current);
                if (titleRef.current) titleRef.current.value = "";
                setParams({});
              }}
            >
              Clear
            </Button>
          </div>
          <JobField label="Job title" name="title">
            {(props) => (
              <input
                {...props}
                type="search"
                ref={titleRef}
                defaultValue={filters.title ?? ""}
                onChange={(event) => titleChanged(event.target.value)}
                placeholder="Search by title"
              />
            )}
          </JobField>
          {jobs.referenceError ? (
            <JobError
              message={jobs.referenceError}
              retry={jobs.retryReferences}
            />
          ) : !jobs.references ? (
            <p role="status">Loading filters…</p>
          ) : (
            <>
              <details className="filter-group" open>
                <summary>Categories</summary>
                <ReferenceChoices
                  label="Select categories"
                  items={jobs.references.categories}
                  selected={filters.categoryIds ?? []}
                  onChange={(ids) => updateFilters({ categoryIds: ids })}
                />
              </details>
              <details className="filter-group">
                <summary>Skills</summary>
                <p className="field-hint">
                  Matches at least one selected skill.
                </p>
                <ReferenceChoices
                  label="Select skills"
                  items={jobs.references.skills}
                  selected={filters.skillIds ?? []}
                  onChange={(ids) => updateFilters({ skillIds: ids })}
                />
              </details>
            </>
          )}
          <form
            className="stack budget-filter"
            key={`${params.get("budgetMin")}:${params.get("budgetMax")}`}
            onSubmit={budgetSubmitted}
          >
            <JobField label="Minimum budget (VND)" name="budgetMin">
              {(props) => (
                <input
                  {...props}
                  type="number"
                  min="0"
                  step="any"
                  defaultValue={params.get("budgetMin") ?? ""}
                />
              )}
            </JobField>
            <JobField label="Maximum budget (VND)" name="budgetMax">
              {(props) => (
                <input
                  {...props}
                  type="number"
                  min="0"
                  step="any"
                  defaultValue={params.get("budgetMax") ?? ""}
                />
              )}
            </JobField>
            <Button type="submit" variant="secondary">
              Set budget range
            </Button>
          </form>
        </aside>
        <section
          className="job-results"
          aria-label="Search results"
          aria-busy={!filterError && !current}
        >
          {freelancer && jobs.historyState !== "ready" && (
            <div className="notice">
              <p>
                {jobs.historyState === "loading"
                  ? "Checking all application history before enabling Apply…"
                  : "Application history could not be checked. Apply is unavailable until the check succeeds."}
              </p>
              {jobs.historyState === "error" && (
                <JobError
                  message={jobs.historyError ?? "History unavailable."}
                  retry={() =>
                    void jobs.refreshHistory().catch(() => undefined)
                  }
                />
              )}
            </div>
          )}
          {filterError ? (
            <JobError message={filterError} />
          ) : current?.error ? (
            <JobError
              message={current.error}
              retry={() => setRetry((v) => v + 1)}
            />
          ) : !current?.page ? (
            <div className="panel" role="status">
              Loading Jobs…
            </div>
          ) : (
            <>
              <p className="muted" aria-live="polite">
                {current.page.items.length} Jobs on this page
              </p>
              {!current.page.items.length && (
                <div className="empty-state">
                  <h2>
                    {filters.pageNumber > 1
                      ? "This page has no Jobs"
                      : "No Jobs found"}
                  </h2>
                  <p>
                    {filters.pageNumber > 1
                      ? "Return to the first page to browse current results."
                      : "Try adjusting your filters or check back later."}
                  </p>
                  {filters.pageNumber > 1 && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setParams(
                          serializeJobFilters({ ...filters, pageNumber: 1 }),
                        )
                      }
                    >
                      Back to first page
                    </Button>
                  )}
                </div>
              )}
              {current.page.items.map((job) => {
                const expired = isJobExpired(job.dueAt, now);
                const applied =
                  jobs.confirmedJobs.has(job.publicId) ||
                  jobs.applications.some(
                    (item) => item.jobPublicId === job.publicId,
                  );
                return (
                  <article
                    className="job-card live-job-card"
                    key={job.publicId}
                  >
                    <div className="chips">
                      <span className="skill-chip">{job.category.name}</span>
                      {expired && (
                        <span className="badge badge-neutral">
                          Deadline passed
                        </span>
                      )}
                    </div>
                    <h2>{job.title}</h2>
                    <p className="live-job-excerpt">{job.description}</p>
                    <details className="job-description">
                      <summary>Read full description</summary>
                      <p>{job.description}</p>
                    </details>
                    <div className="chips">
                      {job.skills.map((skill) => (
                        <span className="skill-chip" key={skill.id}>
                          {skill.name}
                        </span>
                      ))}
                    </div>
                    <dl className="live-job-meta">
                      <div>
                        <dt>Arrangement</dt>
                        <dd>{job.arrangement.name}</dd>
                      </div>
                      <div>
                        <dt>Location</dt>
                        <dd>{job.location}</dd>
                      </div>
                      <div>
                        <dt>Apply by</dt>
                        <dd>
                          <time dateTime={job.dueAt}>
                            {formatJobDate(job.dueAt)}
                          </time>
                        </dd>
                      </div>
                      <div>
                        <dt>Applications</dt>
                        <dd>{job.totalApplicants}</dd>
                      </div>
                    </dl>
                    <div className="job-card-footer">
                      <strong>
                        {formatJobAmount(job.budget, job.currency)}
                      </strong>
                      {freelancer && (
                        <Button
                          disabled={
                            expired || applied || jobs.historyState !== "ready"
                          }
                          onClick={() => setSelectedJob(job)}
                        >
                          {applied
                            ? "Applied"
                            : expired
                              ? "Deadline passed"
                              : "Apply"}
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
              <JobPagination
                page={current.page}
                onPage={(pageNumber) =>
                  setParams(serializeJobFilters({ ...filters, pageNumber }))
                }
              />
            </>
          )}
        </section>
      </div>
      {selectedJob && (
        <ApplyJobDialog
          job={selectedJob}
          onClose={() => setSelectedJob(undefined)}
        />
      )}
    </>
  );
}
