import ApplicantEvaluation from "../components/ApplicantEvaluation";
import { useSearchParams } from "react-router-dom";
import { Button, ButtonLink, PageHeader } from "../components/ui";
import { JobError, JobPagination } from "../components/JobUi";
import { formatJobAmount, formatJobDate } from "../shared/jobFormatters";
import { useJobs } from "../contexts/jobContext";

export default function ApplicationsPage() {
  const jobs = useJobs();
  const [params, setParams] = useSearchParams();
  const raw = Number(params.get("pageNumber") ?? 1);
  const pageNumber = Number.isSafeInteger(raw) && raw >= 1 ? raw : 1;
  const pageSize = 20;
  const totalPages = Math.ceil(jobs.applications.length / pageSize);
  const items = jobs.applications.slice(
    (pageNumber - 1) * pageSize,
    pageNumber * pageSize,
  );
  return (
    <>
      <PageHeader
        eyebrow="Freelancer workspace"
        title="My Applications"
        description="Track the status and details returned for your applications."
        action={
          <Button
            variant="secondary"
            disabled={jobs.historyState === "loading"}
            onClick={() => void jobs.refreshHistory().catch(() => undefined)}
          >
            Refresh history
          </Button>
        }
      />
      {jobs.confirmedJobs.size > 0 && jobs.historyState !== "ready" && (
        <p className="notice">
          Your successful submissions remain confirmed while history is
          synchronized.
        </p>
      )}
      {jobs.historyState === "loading" ? (
        <p role="status">Loading all application history pages…</p>
      ) : jobs.historyState === "error" ? (
        <JobError
          message={jobs.historyError ?? "History unavailable."}
          retry={() => void jobs.refreshHistory().catch(() => undefined)}
        />
      ) : (
        <div className="stack">
          {!items.length && (
            <div className="empty-state">
              <h2>
                {pageNumber > 1
                  ? "No applications on this page"
                  : "No applications yet"}
              </h2>
              <p>
                {pageNumber > 1
                  ? "Return to the first page to view your history."
                  : "Find a Job and submit your first application."}
              </p>
              {pageNumber > 1 ? (
                <Button variant="secondary" onClick={() => setParams({})}>
                  Back to first page
                </Button>
              ) : (
                <ButtonLink to="/jobs">Find Jobs</ButtonLink>
              )}
            </div>
          )}
          {items.map((item) => {
            const job = jobs.knownJobs.get(item.jobPublicId);
            const treatment =
              item.status === "ACCEPTED" || item.status === "COMPLETED"
                ? "success"
                : item.status === "REJECTED"
                  ? "error"
                  : "info";
            return (
              <article
                className="card application-card"
                key={item.jobApplicantPublicId}
              >
                <div className="application-card-header">
                  <div>
                    <h2>{job?.title ?? "Job information unavailable"}</h2>
                    <p className="application-id">Job ID: {item.jobPublicId}</p>
                  </div>
                  <span className={`badge badge-${treatment}`}>
                    {item.status}
                  </span>
                </div>
                <dl className="application-values">
                  <div>
                    <dt>Proposed amount{job ? ` (${job.currency})` : ""}</dt>
                    <dd>{formatJobAmount(item.proposedRate, job?.currency)}</dd>
                    {!job && (
                      <p className="field-hint">
                        Currency information unavailable.
                      </p>
                    )}
                  </div>
                  <div>
                    <dt>Estimated days</dt>
                    <dd>{item.estimatedDays}</dd>
                  </div>
                  <div>
                    <dt>Applied at</dt>
                    <dd>
                      <time dateTime={item.appliedAt}>
                        {formatJobDate(item.appliedAt)}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt>Matching score</dt>
                    <dd>{item.matchingScore}</dd>
                  </div>
                </dl>
                <p className="application-id">
                  Application ID: {item.jobApplicantPublicId}
                </p>
                <ApplicantEvaluation
                  key={`${item.jobPublicId}:${item.resumePublicId}`}
                  jobId={item.jobPublicId}
                  resumeId={item.resumePublicId}
                />
              </article>
            );
          })}
          <JobPagination
            page={{
              items,
              totalPages,
              pageNumber,
              pageSize,
              hasPrevious: pageNumber > 1,
              hasNext: pageNumber < totalPages,
            }}
            onPage={(number) =>
              setParams(number === 1 ? {} : { pageNumber: String(number) })
            }
          />
        </div>
      )}
    </>
  );
}
