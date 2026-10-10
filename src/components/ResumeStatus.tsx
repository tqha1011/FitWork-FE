import { Button } from "./ui";
import { useResumes } from "../contexts/resumeContext";
import { processingLabels } from "../shared/processingState";
import type { SessionResume } from "../contexts/resumeContext";
export default function ResumeStatus({ resume }: { resume: SessionResume }) {
  const { reconnectResume } = useResumes();
  const status = resume.ingestionStatus;
  return (
    <div className="stack resume-status" aria-live="polite">
      <span
        className={`badge badge-${status === "COMPLETED" ? "success" : status === "FAILED" ? "error" : "info"}`}
      >
        {processingLabels[status]}
      </span>
      {resume.state?.errorMessage && (
        <p className="field-error-text">{resume.state.errorMessage}</p>
      )}
      {resume.connection === "denied" && (
        <p className="field-error-text">
          Unable to subscribe to this resume. Check your access or try
          reconnecting.
        </p>
      )}
      {resume.connection === "uncertain" && (
        <p className="muted">
          Waiting for confirmation. Live updates are unavailable; the processing
          outcome is unknown.
        </p>
      )}
      {resume.connection === "connecting" && (
        <p className="muted">Connecting to live updates…</p>
      )}
      {(resume.connection === "uncertain" ||
        resume.connection === "denied") && (
        <Button
          variant="secondary"
          onClick={() => reconnectResume(resume.publicId)}
        >
          Reconnect updates
        </Button>
      )}
    </div>
  );
}
