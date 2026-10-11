import { useEffect, useState } from "react";
import { Button, Dialog } from "./ui";
import { JobError } from "./JobUi";
import ResumeStatus from "./ResumeStatus";
import { useResumes, type SessionResume } from "../contexts/resumeContext";
import { getResume } from "../services/resumeService";
import { registerSavedResume } from "../shared/resumeSession";
import { processingErrorMessage } from "../shared/processingErrorMessage";
import type { ResumeItem } from "../types/resume";

export default function ResumeDetailsDialog({
  publicId,
  onClose,
  onFile,
}: {
  publicId: string;
  onClose: () => void;
  onFile: (resume: SessionResume, inline: boolean) => void;
}) {
  const { resumes, rememberSavedResumes } = useResumes();
  const [result, setResult] = useState<ResumeItem>();
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getResume(publicId, controller.signal)
      .then((item) => {
        if (controller.signal.aborted) return;
        rememberSavedResumes([item]);
        setResult(item);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(processingErrorMessage(error));
      });
    return () => controller.abort();
  }, [publicId, revision, rememberSavedResumes]);
  const resume = result
    ? (resumes.find((item) => item.publicId === publicId) ??
      registerSavedResume(result))
    : undefined;
  return (
    <Dialog open title={result?.fileName ?? "Resume details"} onClose={onClose}>
      {error ? (
        <JobError
          message={error}
          retry={() => {
            setError("");
            setResult(undefined);
            setRevision((value) => value + 1);
          }}
        />
      ) : !result || !resume ? (
        <p role="status">Loading resume details…</p>
      ) : (
        <>
          <p className="muted">
            {result.fileType.toUpperCase()} ·{" "}
            {(result.fileSize / 1024).toFixed(1)} KB
          </p>
          <ResumeStatus resume={resume} />
          <dl className="resume-metadata">
            <dt>Uploaded</dt>
            <dd>{new Date(result.createdAt).toLocaleString()}</dd>
            <dt>Updated</dt>
            <dd>{new Date(result.updatedAt).toLocaleString()}</dd>
          </dl>
          <div className="dialog-actions">
            {result.fileType === "pdf" && (
              <Button variant="secondary" onClick={() => onFile(resume, true)}>
                Preview
              </Button>
            )}
            <Button variant="secondary" onClick={() => onFile(resume, false)}>
              Download
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
