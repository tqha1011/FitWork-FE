import { useCallback, useEffect, useRef, useState } from "react";
import { isCancel } from "axios";
import {
  ArrowRightLeft,
  BriefcaseBusiness,
  Clock,
  FileText,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { Button, Dialog } from "./ui";
import { useAuth } from "../contexts/authContext";
import ResumeUploadDialog from "./ResumeUploadDialog";
import DemoApplicationCard from "./DemoApplicationCard";
import DemoEvaluationDialog, {
  type DemoResultSelection,
} from "./DemoEvaluationDialog";
import {
  clearAccessToken,
  getSessionGeneration,
} from "../services/authSession";
import { getDemoSession } from "../services/demoService";
import {
  applyToJob,
  getApplications,
  searchJobs,
  updateApplicationStatus,
} from "../services/jobService";
import { createEvaluation } from "../services/evaluationService";
import { getResumeDownloadUrl } from "../services/resumeService";
import { watchProcessing } from "../services/processingSocket";
import { demoErrorMessage } from "../shared/demoErrorMessage";
import type { DemoApplication, DemoSession } from "../types/demo";
import type { JobItem } from "../types/job";
import type { UserType } from "../types/auth";

function EvaluationMonitor({
  id,
  reload,
}: {
  id: string;
  reload: () => Promise<void>;
}) {
  useEffect(
    () =>
      watchProcessing(
        "evaluation",
        id,
        () => {
          void reload();
        },
        () => undefined,
      ),
    [id, reload],
  );
  return null;
}

export default function DemoWorkspace({
  onSwitch,
}: {
  onSwitch: (role: UserType) => Promise<void>;
}) {
  const { session: auth } = useAuth();
  const [workspace, setWorkspace] = useState<DemoSession>();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [now, setNow] = useState(Date.now);
  const [selection, setSelection] = useState<DemoResultSelection>();
  const [preview, setPreview] = useState<{ name: string; url: string }>();
  const [upload, setUpload] = useState(false);
  const [resumeId, setResumeId] = useState("");
  const [launchedId, setLaunchedId] = useState<string>();
  const controller = useRef<AbortController | null>(null);
  const flight = useRef<Promise<void> | null>(null);
  const locked = useRef(false);
  const generation = getSessionGeneration();
  const applicant = auth?.user.role === "freelancer";
  const reload = useCallback((): Promise<void> => {
    if (flight.current) return flight.current;
    const abort = controller.current;
    if (!abort || abort.signal.aborted) return Promise.resolve();
    const request = (async () => {
      try {
        const [data, page] = await Promise.all([
          getDemoSession(abort.signal),
          searchJobs({ pageNumber: 1, pageSize: 20 }, abort.signal),
          ...(applicant ? [getApplications(1, 20, abort.signal)] : []),
        ]);
        if (abort.signal.aborted || generation !== getSessionGeneration())
          return;
        if (Date.parse(data.expiresAt) <= Date.now()) {
          clearAccessToken();
          return;
        }
        setWorkspace(data);
        setJobs(page.items);
        setError("");
      } catch (error) {
        if (
          !abort.signal.aborted &&
          generation === getSessionGeneration() &&
          !isCancel(error)
        )
          setError(demoErrorMessage(error));
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    })().finally(() => {
      if (flight.current === request) flight.current = null;
    });
    flight.current = request;
    return request;
  }, [applicant, generation]);
  useEffect(() => {
    controller.current = new AbortController();
    void reload();
    const poll = window.setInterval(() => {
      void reload();
    }, 15000);
    const reconcile = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", reconcile);
    return () => {
      controller.current?.abort();
      flight.current = null;
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", reconcile);
    };
  }, [reload]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  async function mutate(key: string, operation: () => Promise<unknown>) {
    if (locked.current) return;
    locked.current = true;
    setAction(key);
    setError("");
    let failure: string | undefined;
    try {
      await operation();
    } catch (error) {
      if (!isCancel(error)) failure = demoErrorMessage(error);
    }
    // Reconcile even a quota error or lost mutation response. A previous read
    // may have started before the mutation; wait, then fetch fresh server state.
    if (
      generation === getSessionGeneration() &&
      !controller.current?.signal.aborted
    ) {
      await flight.current;
      await reload();
      if (failure) setError(failure);
      setAction("");
    }
    locked.current = false;
  }
  async function openCv(id: string, name: string) {
    if (locked.current) return;
    locked.current = true;
    setAction(`cv:${id}`);
    try {
      const url = await getResumeDownloadUrl(id, "inline");
      if (
        generation === getSessionGeneration() &&
        !controller.current?.signal.aborted
      )
        setPreview({ name, url });
    } catch (error) {
      if (!isCancel(error)) setError(demoErrorMessage(error));
    } finally {
      locked.current = false;
      setAction("");
    }
  }
  function openResult(
    application: DemoApplication,
    publicId: string,
    source: "SAMPLE" | "LIVE",
  ) {
    setSelection({
      jobPublicId: application.jobPublicId,
      evaluationPublicId: publicId,
      source,
      applicantName: application.applicantName,
    });
  }
  if (!workspace)
    return (
      <main id="demo-content" tabIndex={-1} className="system-page">
        {loading ? (
          <p role="status">Loading demo workspace…</p>
        ) : (
          <>
            <h1>Workspace unavailable</h1>
            <p role="alert">{error}</p>
            <Button onClick={() => void reload()}>Retry loading</Button>
          </>
        )}
      </main>
    );
  const seconds = Math.max(
    0,
    Math.ceil((Date.parse(workspace.expiresAt) - now) / 1000),
  );
  const countdown = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const selectedResume =
    resumeId ||
    workspace.resumes.find((resume) => resume.isPrimaryApplicant)?.publicId ||
    "";
  const pending = workspace.applications.flatMap((application) =>
    application.evaluations
      .filter(
        (item) =>
          item.source === "LIVE" &&
          (item.status === "PENDING" || item.status === "PROCESSING"),
      )
      .map((item) => item.publicId),
  );
  const monitors = [
    ...new Set([
      ...pending,
      ...(launchedId &&
      !workspace.applications.some((application) =>
        application.evaluations.some(
          (item) =>
            item.publicId === launchedId &&
            (item.status === "COMPLETED" || item.status === "FAILED"),
        ),
      )
        ? [launchedId]
        : []),
    ]),
  ];
  return (
    <>
      <section className="demo-banner" aria-label="Demo session">
        <div className="demo-role">
          <span className="demo-role-icon">
            <BriefcaseBusiness size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Your current role</p>
            <strong>{applicant ? "Applicant" : "Recruiter"}</strong>
          </div>
        </div>
        <div className="demo-budget">
          <Clock size={18} aria-hidden="true" />
          <span>
            <strong>{countdown}</strong> remaining
          </span>
        </div>
        <div className="demo-budget">
          <Sparkles size={18} aria-hidden="true" />
          <span>
            <strong>{workspace.ai.remaining}</strong> AI runs available{" "}
            <small>
              {workspace.ai.used}/{workspace.ai.limit} session runs used
            </small>
          </span>
        </div>
        <Button
          variant="secondary"
          disabled={!!action}
          onClick={() => void onSwitch(applicant ? "COMPANY" : "APPLICANT")}
        >
          <ArrowRightLeft size={17} aria-hidden="true" />
          Switch to {applicant ? "recruiter" : "applicant"}
        </Button>
      </section>
      <main id="demo-content" tabIndex={-1} className="demo-content">
        <header className="page-header">
          <div>
            <p className="eyebrow">Explore FitWork</p>
            <h1>
              {applicant
                ? "Find your next opportunity."
                : "Meet your next great hire."}
            </h1>
            <p className="muted">
              {applicant
                ? "Preview your CV, apply to another job, then try a live AI evaluation."
                : "Review prepared applications, explore the evidence, and try a hiring decision."}
            </p>
          </div>
          <Button
            variant="ghost"
            disabled={!!action}
            onClick={() => void reload()}
          >
            Refresh workspace
          </Button>
        </header>
        <div className="demo-steps" aria-label="Demo journey">
          <span className={!applicant ? "active" : ""}>
            01 Review sample applications
          </span>
          <span className={applicant ? "active" : ""}>
            02 Apply &amp; try AI
          </span>
          <span>03 Switch back &amp; decide</span>
        </div>
        {error && (
          <p className="job-error" role="alert">
            {error}
          </p>
        )}
        {!workspace.ai.available && (
          <p className="notice">
            Live AI unavailable:{" "}
            {workspace.ai.unavailableReason ||
              "The server quota or AI configuration currently prevents new runs."}{" "}
            Sample results remain available.
          </p>
        )}
        {action && (
          <p role="status" className="demo-action-status">
            <LoaderCircle size={16} className="spin" aria-hidden="true" />
            Updating workspace…
          </p>
        )}
        {applicant && (
          <section
            className="demo-cv-section panel stack"
            aria-labelledby="demo-cvs"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Ready to apply</p>
                <h2 id="demo-cvs">Your CVs</h2>
              </div>
              <Button
                variant="secondary"
                disabled={!!action || workspace.uploads.remaining <= 0}
                onClick={() => setUpload(true)}
              >
                Upload CV
              </Button>
            </div>
            <p className="muted">
              {workspace.uploads.remaining} upload URLs remaining · Maximum{" "}
              {Math.floor(workspace.uploads.maxFileBytes / 1024 / 1024)} MiB per
              file
            </p>
            <label className="field-label" htmlFor="demo-resume">
              CV for new applications
            </label>
            <select
              id="demo-resume"
              value={selectedResume}
              onChange={(event) => setResumeId(event.target.value)}
              disabled={!!action}
            >
              {workspace.resumes.map((resume) => (
                <option key={resume.publicId} value={resume.publicId}>
                  {resume.fileName}
                  {resume.isPrimaryApplicant ? " · Primary CV" : ""}
                </option>
              ))}
            </select>
            <div className="demo-cv-list">
              {workspace.resumes.map((resume) => (
                <Button
                  key={resume.publicId}
                  variant="secondary"
                  disabled={!!action}
                  onClick={() => void openCv(resume.publicId, resume.fileName)}
                >
                  <FileText size={17} aria-hidden="true" />
                  Preview {resume.fileName}
                </Button>
              ))}
            </div>
          </section>
        )}
        <section aria-labelledby="demo-applications">
          <div className="section-heading">
            <h2 id="demo-applications">
              {applicant ? "Your applications" : "Demo applications"}
            </h2>
            <span className="badge badge-neutral">
              {workspace.applications.length} applications
            </span>
          </div>
          <div className="demo-applications">
            {workspace.applications.map((application) => (
              <DemoApplicationCard
                key={application.publicId}
                application={application}
                title={
                  workspace.jobs.find(
                    (job) => job.publicId === application.jobPublicId,
                  )?.title ?? "Demo job"
                }
                applicant={applicant}
                busy={!!action}
                ai={workspace.ai}
                onPreview={() =>
                  void openCv(
                    application.resumePublicId,
                    workspace.resumes.find(
                      (resume) =>
                        resume.publicId === application.resumePublicId,
                    )?.fileName ?? application.applicantName,
                  )
                }
                onResult={(id, source) => openResult(application, id, source)}
                onAI={() =>
                  void mutate(`ai:${application.publicId}`, async () => {
                    const result = await createEvaluation(
                      application.resumePublicId,
                      application.jobPublicId,
                    );
                    if (generation === getSessionGeneration())
                      setLaunchedId(result.publicId);
                  })
                }
                onDecision={(status) =>
                  void mutate(`decision:${application.publicId}`, () =>
                    updateApplicationStatus(application.publicId, status),
                  )
                }
              />
            ))}
          </div>
        </section>
        {applicant && (
          <section className="demo-jobs-section" aria-labelledby="demo-jobs">
            <div className="section-heading">
              <h2 id="demo-jobs">Explore demo jobs</h2>
              <span className="muted">Apply before running AI</span>
            </div>
            <div className="demo-jobs">
              {workspace.jobs.map((job) => {
                const applied = workspace.applications.some(
                  (application) => application.jobPublicId === job.publicId,
                );
                const detail = jobs.find(
                  (item) => item.publicId === job.publicId,
                );
                return (
                  <article className="panel stack" key={job.publicId}>
                    <span
                      className={`badge badge-${job.isFeatured ? "info" : "neutral"}`}
                    >
                      {job.isFeatured
                        ? "Featured sample job"
                        : "Demo opportunity"}
                    </span>
                    <h3>{job.title}</h3>
                    {detail?.description && (
                      <p className="demo-job-description muted">
                        {detail.description}
                      </p>
                    )}
                    <Button
                      disabled={applied || !!action || !selectedResume}
                      onClick={() =>
                        void mutate(`apply:${job.publicId}`, () =>
                          applyToJob(job.publicId, {
                            resumePublicId: selectedResume,
                            coverLetter:
                              "I would like to contribute to your team.",
                            proposedRate: 15000000,
                            estimatedDay: 30,
                          }),
                        )
                      }
                    >
                      {applied ? "Applied" : "Apply to job"}
                    </Button>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
      {applicant &&
        monitors.map((id) => (
          <EvaluationMonitor key={id} id={id} reload={reload} />
        ))}
      {selection && (
        <DemoEvaluationDialog
          key={selection.evaluationPublicId}
          selection={selection}
          userType={workspace.userType}
          onClose={() => setSelection(undefined)}
        />
      )}
      {preview && (
        <Dialog
          open
          title={`CV preview · ${preview.name}`}
          onClose={() => setPreview(undefined)}
          className="demo-cv-dialog"
        >
          <p className="muted">
            This preview link expires with your demo session or within 15
            minutes.
          </p>
          <iframe title={`CV preview: ${preview.name}`} src={preview.url} />
          <div className="dialog-actions">
            <a
              className="button button-secondary"
              href={preview.url}
              target="_blank"
              rel="noreferrer"
            >
              Open CV in new tab
            </a>
            <Button variant="secondary" onClick={() => setPreview(undefined)}>
              Close preview
            </Button>
          </div>
        </Dialog>
      )}
      {upload && (
        <ResumeUploadDialog
          onClose={() => {
            setUpload(false);
            void reload();
          }}
        />
      )}
    </>
  );
}
