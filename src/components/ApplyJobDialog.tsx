import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button, Dialog } from "./ui";
import { JobError, JobField } from "./JobUi";
import { formatJobDate } from "../shared/jobFormatters";
import { useJobs } from "../contexts/jobContext";
import { applyToJob } from "../services/jobService";
import {
  createResume,
  requestResumeUpload,
  uploadResumeFile,
} from "../services/resumeService";
import {
  isUncertainMutation,
  jobErrorMessage,
} from "../shared/jobErrorMessage";
import {
  isJobExpired,
  resumeContentType,
  validateApplication,
  type FieldErrors,
} from "../shared/jobValidation";
import type { JobApplicationItem, JobItem, ResumeResponse } from "../types/job";

export default function ApplyJobDialog({
  job,
  onClose,
}: {
  job: JobItem;
  onClose: () => void;
}) {
  const jobs = useJobs();
  const [file, setFile] = useState<File>();
  const [resume, setResume] = useState<ResumeResponse>();
  const [uploadedKey, setUploadedKey] = useState<string>();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [application, setApplication] = useState<JobApplicationItem>();
  const [now, setNow] = useState(Date.now);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    controller.current = new AbortController();
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      controller.current?.abort();
      window.clearInterval(timer);
    };
  }, []);
  const expired = isJobExpired(job.dueAt, now);
  const alreadyApplied =
    jobs.confirmedJobs.has(job.publicId) ||
    jobs.applications.some((item) => item.jobPublicId === job.publicId);
  const successful = submitted || alreadyApplied;
  async function syncHistory() {
    setPending(true);
    setStage("Synchronizing application history…");
    setError(undefined);
    try {
      const items = await jobs.refreshHistory();
      const found = items.find((item) => item.jobPublicId === job.publicId);
      if (found) setApplication(found);
      else
        setError(
          "Your application succeeded, but it is not yet visible in history. Retry loading history only.",
        );
    } catch (error) {
      setError(
        `Your application succeeded. History could not be synchronized. ${jobErrorMessage(error)}`,
      );
    } finally {
      setPending(false);
      setStage("");
    }
  }
  function selectFile(next?: File) {
    setError(undefined);
    setResume(undefined);
    setUploadedKey(undefined);
    setProgress(0);
    if (!next) {
      setFile(undefined);
      return;
    }
    try {
      resumeContentType(next);
      setFile(next);
      setErrors((prev) => ({ ...prev, resume: "" }));
    } catch (error) {
      setFile(undefined);
      setErrors((prev) => ({ ...prev, resume: jobErrorMessage(error) }));
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || successful || jobs.historyState !== "ready") return;
    const form = new FormData(event.currentTarget);
    const valid = validateApplication({
      coverLetter: String(form.get("coverLetter") ?? ""),
      proposedRate: String(form.get("proposedRate") ?? ""),
      estimatedDay: String(form.get("estimatedDay") ?? ""),
    });
    const fieldErrors = { ...valid.errors };
    if (!file && !resume) fieldErrors.resume = "Choose a PDF or DOCX resume.";
    setErrors(fieldErrors);
    setError(undefined);
    if (!valid.payload || Object.keys(fieldErrors).length) return;
    if (isJobExpired(job.dueAt)) {
      setError("The application deadline has passed.");
      return;
    }
    setPending(true);
    let applyStarted = false;
    let step = "Checking application history";
    try {
      setStage(`${step}…`);
      const history = await jobs.refreshHistory();
      const duplicate = history.find(
        (item) => item.jobPublicId === job.publicId,
      );
      if (duplicate) {
        jobs.confirmApplication(job.publicId);
        setApplication(duplicate);
        setSubmitted(true);
        return;
      }
      let readyResume = resume;
      if (!readyResume && file) {
        let key = uploadedKey;
        if (!key) {
          step = "Requesting resume upload URL";
          setStage(`${step}…`);
          const upload = await requestResumeUpload(
            file,
            controller.current?.signal,
          );
          step = "Uploading resume to storage";
          setStage(`${step}…`);
          await uploadResumeFile(
            upload.uploadUrl,
            file,
            setProgress,
            controller.current?.signal,
          );
          key = upload.storageKey;
          setUploadedKey(key);
        }
        step = "Registering uploaded resume";
        setStage(`${step}…`);
        readyResume = await createResume(
          file.name,
          key,
          controller.current?.signal,
        );
        if (!readyResume.publicId)
          throw new Error("The resume response is incomplete. Please retry.");
        setResume(readyResume);
      }
      if (!readyResume) throw new Error("Choose a resume first.");
      if (isJobExpired(job.dueAt))
        throw new Error("The application deadline passed during upload.");
      step = "Submitting application";
      setStage(`${step}…`);
      applyStarted = true;
      await applyToJob(job.publicId, {
        ...valid.payload,
        resumePublicId: readyResume.publicId,
      });
      setSubmitted(true);
      jobs.confirmApplication(job.publicId);
      jobs.invalidateSearch();
      step = "Synchronizing application history";
      setStage(`${step}…`);
      try {
        const history = await jobs.refreshHistory();
        const found = history.find((item) => item.jobPublicId === job.publicId);
        if (found) setApplication(found);
        else
          setError(
            "Your application succeeded, but it is not yet visible in history. Retry loading history only.",
          );
      } catch (error) {
        setError(
          `Your application succeeded. History could not be synchronized. ${jobErrorMessage(error)}`,
        );
      }
    } catch (error) {
      if (controller.current?.signal.aborted) return;
      setError(
        `${step}: ${jobErrorMessage(error, step !== "Checking application history")}`,
      );
      if (applyStarted && isUncertainMutation(error)) {
        setStage(
          "Checking all history pages to resolve the uncertain submission…",
        );
        try {
          const history = await jobs.refreshHistory();
          const found = history.find(
            (item) => item.jobPublicId === job.publicId,
          );
          if (found) {
            setSubmitted(true);
            setApplication(found);
            jobs.confirmApplication(job.publicId);
            jobs.invalidateSearch();
            setError(undefined);
          } else
            setError(
              `${jobErrorMessage(error, true)} All history pages were checked and this Job has no application yet. You may choose to submit again; your created resume will be reused.`,
            );
        } catch (historyError) {
          setError(
            `${jobErrorMessage(error, true)} History verification failed. Retry the history check before submitting again. ${jobErrorMessage(historyError)}`,
          );
        }
      }
    } finally {
      setPending(false);
      setStage("");
    }
  }
  return (
    <Dialog
      open
      title={successful ? "Application submitted" : "Apply to Job"}
      onClose={() => {
        if (!pending) onClose();
      }}
      className="job-apply-dialog"
    >
      <p>
        <strong>{job.title}</strong>
      </p>
      <p className="muted">Deadline: {formatJobDate(job.dueAt)}</p>
      {successful ? (
        <div className="stack" style={{ marginTop: 20 }}>
          <p role="status">Your application has been submitted successfully.</p>
          {application && (
            <p>
              Status: {application.status}
              <br />
              Application ID:{" "}
              <span className="application-id">
                {application.jobApplicantPublicId}
              </span>
            </p>
          )}
          {error && (
            <JobError message={error} retry={() => void syncHistory()} />
          )}
          {!application && !error && (
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => void syncHistory()}
            >
              Load application history
            </Button>
          )}
          <Link className="text-link" to="/freelancer/applications">
            View My Applications
          </Link>
          <Button variant="secondary" disabled={pending} onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <form
          className="stack"
          noValidate
          onSubmit={submit}
          style={{ marginTop: 20 }}
        >
          <fieldset className="job-form-fields stack" disabled={pending}>
            <JobField
              label="Cover letter"
              name="coverLetter"
              error={errors.coverLetter}
            >
              {(props) => <textarea {...props} required autoFocus />}
            </JobField>
            <div className="form-grid">
              <JobField
                label={`Proposed amount (${job.currency})`}
                name="proposedRate"
                error={errors.proposedRate}
                hint={`Your proposal uses the Job currency: ${job.currency}.`}
              >
                {(props) => (
                  <input {...props} type="number" min="0" step="any" required />
                )}
              </JobField>
              <JobField
                label="Estimated days"
                name="estimatedDay"
                error={errors.estimatedDay}
              >
                {(props) => (
                  <input {...props} type="number" min="1" step="1" required />
                )}
              </JobField>
            </div>
            <JobField
              label="Resume (PDF or DOCX)"
              name="resume"
              error={errors.resume}
              hint="1 byte to 5 MiB. The uploaded resume will be shared with this application."
            >
              {(props) => (
                <input
                  {...props}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => selectFile(event.target.files?.[0])}
                />
              )}
            </JobField>
            {resume && (
              <p className="notice">
                Resume ready: {file?.name}. It will be reused if you retry
                submitting.
              </p>
            )}
          </fieldset>
          {pending && (
            <div className="upload-status" role="status">
              <p>{stage}</p>
              {stage === "Uploading resume to storage…" && (
                <>
                  <progress
                    aria-label="Resume upload progress"
                    value={progress}
                    max={100}
                  />
                  <span>{progress}%</span>
                </>
              )}
            </div>
          )}
          {error && <JobError message={error} />}
          {jobs.historyState === "error" && (
            <JobError
              message={jobs.historyError ?? "History unavailable."}
              retry={() => void jobs.refreshHistory().catch(() => undefined)}
            />
          )}
          {expired && (
            <p className="job-error" role="alert">
              The application deadline has passed.
            </p>
          )}
          <div className="dialog-actions">
            <Button variant="secondary" disabled={pending} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || expired || jobs.historyState !== "ready"}
            >
              {pending ? "Processing…" : "Submit application"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
