import { useState } from "react";
import {
  FileText,
  Upload,
  Download,
  Eye,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button, Dialog, PageHeader } from "../components/ui";
import ResumeUploadDialog from "../components/ResumeUploadDialog";
import ResumeStatus from "../components/ResumeStatus";
import { useResumes, type SessionResume } from "../contexts/resumeContext";
import {
  deleteResume,
  getResumeDownloadUrl,
  updateResume,
} from "../services/resumeService";
import { processingErrorMessage } from "../shared/processingErrorMessage";
export default function ResumesPage() {
  const { resumes, forgetResume, rememberResume } = useResumes();
  const [upload, setUpload] = useState<true | SessionResume>();
  const [removing, setRemoving] = useState<SessionResume>();
  const [preview, setPreview] = useState<{ name: string; url: string }>();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function action(id: string, fn: () => Promise<void>) {
    if (busy) return;
    setBusy(id);
    setError("");
    try {
      await fn();
    } catch (error) {
      setError(processingErrorMessage(error));
    } finally {
      setBusy("");
    }
  }
  async function openFile(resume: SessionResume, inline: boolean) {
    const url = await getResumeDownloadUrl(
      resume.publicId,
      inline ? "inline" : "attachment",
    );
    if (inline) setPreview({ name: resume.name, url });
    else {
      const link = document.createElement("a");
      link.href = url;
      link.rel = "noopener noreferrer";
      link.target = "_blank";
      document.body.append(link);
      link.click();
      link.remove();
    }
  }
  return (
    <>
      <PageHeader
        title="My Resumes"
        description="Prepare your experience for your next application."
        action={
          <Button disabled={!!busy} onClick={() => setUpload(true)}>
            <Upload size={18} aria-hidden="true" /> Upload resume
          </Button>
        }
      />
      <div className="resume-session-note">
        <FileText size={20} aria-hidden="true" />
        <p>
          <strong>Resumes available in this session</strong>
          <br />
          <span className="muted">
            This collection includes files registered here. A complete saved
            resume list is not available yet; it resets when you reload or sign
            out.
          </span>
        </p>
      </div>
      {error && (
        <p role="alert" className="job-error">
          {error}
        </p>
      )}
      {!resumes.length ? (
        <div className="empty-state">
          <FileText size={36} aria-hidden="true" />
          <h2>Your next opportunity starts with your CV</h2>
          <p>
            Upload a resume to follow its reading progress, then use it when you
            apply.
          </p>
          <Button onClick={() => setUpload(true)}>
            Upload your first resume
          </Button>
        </div>
      ) : (
        <div className="resume-list">
          {resumes.map((resume) => (
            <article className="card resume-card" key={resume.publicId}>
              <div className="resume-file-heading">
                <span className="resume-file-icon">
                  <FileText size={28} aria-hidden="true" />
                </span>
                <div>
                  <h2>{resume.name}</h2>
                  <p className="muted">
                    {resume.contentType === "application/pdf" ? "PDF" : "DOCX"}{" "}
                    · {(resume.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <ResumeStatus resume={resume} />
              <div className="actions resume-actions">
                {resume.contentType === "application/pdf" && (
                  <Button
                    variant="secondary"
                    disabled={!!busy}
                    onClick={() =>
                      void action(resume.publicId, () => openFile(resume, true))
                    }
                  >
                    <Eye size={16} aria-hidden="true" />
                    Preview
                  </Button>
                )}
                <Button
                  variant="secondary"
                  disabled={!!busy}
                  onClick={() =>
                    void action(resume.publicId, () => openFile(resume, false))
                  }
                >
                  <Download size={16} aria-hidden="true" />
                  Download
                </Button>
                <Button
                  variant="secondary"
                  disabled={!!busy}
                  onClick={() => setUpload(resume)}
                >
                  Replace file
                </Button>
                {resume.ingestionStatus === "FAILED" && (
                  <Button
                    variant="secondary"
                    disabled={!!busy}
                    onClick={() =>
                      void action(resume.publicId, async () => {
                        const reference = await updateResume(
                          resume.publicId,
                          resume.name,
                          resume.storageKey,
                        );
                        rememberResume(reference, resume);
                      })
                    }
                  >
                    <RefreshCw size={16} aria-hidden="true" />
                    Retry reading
                  </Button>
                )}
                <Button
                  variant="ghost"
                  disabled={!!busy}
                  onClick={() => setRemoving(resume)}
                  aria-label={`Delete ${resume.name}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {upload && (
        <ResumeUploadDialog
          replacing={upload === true ? undefined : upload}
          onClose={() => setUpload(undefined)}
        />
      )}
      {removing && (
        <Dialog
          open
          title="Delete resume?"
          onClose={() => {
            if (!busy) setRemoving(undefined);
          }}
        >
          <p>
            Remove “{removing.name}” from your active resumes? Existing
            evaluation history will remain.
          </p>
          {error && (
            <p className="job-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <Button
              variant="secondary"
              disabled={!!busy}
              onClick={() => setRemoving(undefined)}
            >
              Keep resume
            </Button>
            <Button
              variant="danger"
              disabled={!!busy}
              onClick={() =>
                void action(removing.publicId, async () => {
                  await deleteResume(removing.publicId);
                  forgetResume(removing.publicId);
                  setRemoving(undefined);
                })
              }
            >
              {busy ? "Deleting…" : "Delete resume"}
            </Button>
          </div>
        </Dialog>
      )}
      {preview && (
        <Dialog
          open
          title={preview.name}
          onClose={() => setPreview(undefined)}
          className="resume-preview-dialog"
        >
          <p className="muted">
            If the preview expires, close it and request a new preview.
          </p>
          <iframe
            title={`Preview ${preview.name}`}
            src={preview.url}
            className="resume-preview"
          />
          <Button variant="secondary" onClick={() => setPreview(undefined)}>
            Close preview
          </Button>
        </Dialog>
      )}
    </>
  );
}
