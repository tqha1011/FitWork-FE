import { Button } from "./ui";
import { useResumes } from "../contexts/resumeContext";
import { processingLabels } from "../shared/processingState";
import type { SessionResume } from "../contexts/resumeContext";
export default function ResumeStatus({ resume }: { resume: SessionResume }) {
  const { reconnectResume } = useResumes();
  const status = resume.ingestionStatus;
  if (!status)
    return (
      <div className="stack resume-status">
        <span className="badge badge-neutral">Not processed yet</span>
      </div>
    );
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
      {resume.ingestionPublicId && resume.connection === "denied" && (
        <p className="field-error-text">
          Unable to update this resume. Please retry.
        </p>
      )}
      {resume.ingestionPublicId && resume.connection === "uncertain" && (
        <p className="muted">
          Could not update the resume status. Please retry.
        </p>
      )}
      {resume.ingestionPublicId && resume.connection === "connecting" && (
        <p className="muted">Updating status…</p>
      )}
      {resume.ingestionPublicId &&
        (resume.connection === "uncertain" ||
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
