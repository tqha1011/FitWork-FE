import { useEffect, useState } from "react";
import {
  FileText,
  Upload,
  Download,
  Eye,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button, Dialog, PageHeader } from "../components/ui";
import { useSearchParams } from "react-router-dom";
import { JobError, JobPagination } from "../components/JobUi";
import ResumeDetailsDialog from "../components/ResumeDetailsDialog";
import { registerSavedResume } from "../shared/resumeSession";
import type { ResumeItem } from "../types/resume";
import type { PageResult } from "../types/job";
import ResumeUploadDialog from "../components/ResumeUploadDialog";
import ResumeStatus from "../components/ResumeStatus";
import { useResumes, type SessionResume } from "../contexts/resumeContext";
import {
  deleteResume,
  getResumeDownloadUrl,
  getResumes,
  updateResume,
} from "../services/resumeService";
import { processingErrorMessage } from "../shared/processingErrorMessage";
export default function ResumesPage() {
  const [params, setParams] = useSearchParams();
  const requestedPage = Number(params.get("pageNumber") ?? 1);
  const requestedSize = Number(params.get("pageSize") ?? 20);
  const pageNumber =
    Number.isSafeInteger(requestedPage) && requestedPage >= 1
      ? requestedPage
      : 1;
  const pageSize =
    Number.isSafeInteger(requestedSize) &&
    requestedSize >= 1 &&
    requestedSize <= 100
      ? requestedSize
      : 20;
  return (
    <ResumeCollection
      key={`${pageNumber}:${pageSize}`}
      pageNumber={pageNumber}
      pageSize={pageSize}
      onPage={(value) => {
        const next = new URLSearchParams(params);
        next.set("pageNumber", String(value));
        next.set("pageSize", String(pageSize));
        setParams(next);
      }}
    />
  );
}

function ResumeCollection({
  pageNumber,
  pageSize,
  onPage,
}: {
  pageNumber: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  const { resumes, forgetResume, rememberResume, rememberSavedResumes } =
    useResumes();
  const [page, setPage] = useState<PageResult<ResumeItem>>();
  const [listError, setListError] = useState("");
  const [revision, setRevision] = useState(0);
  const [details, setDetails] = useState("");
  function refreshList() {
    setPage(undefined);
    setListError("");
    setRevision((value) => value + 1);
  }
  useEffect(() => {
    const controller = new AbortController();
    getResumes(pageNumber, pageSize, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        rememberSavedResumes(result.items);
        setPage(result);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setListError(processingErrorMessage(error));
      });
    return () => controller.abort();
  }, [pageNumber, pageSize, revision, rememberSavedResumes]);
  const visibleResumes =
    page?.items.map(
      (item) =>
        resumes.find((resume) => resume.publicId === item.publicId) ??
        registerSavedResume(item),
    ) ?? [];
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
          <div className="actions">
            <Button
              variant="secondary"
              disabled={!!busy || (!page && !listError)}
              onClick={refreshList}
            >
              Refresh list
            </Button>
            <Button disabled={!!busy} onClick={() => setUpload(true)}>
              <Upload size={18} aria-hidden="true" /> Upload resume
            </Button>
          </div>
        }
      />
      {error && (
        <p role="alert" className="job-error">
          {error}
        </p>
      )}
      {listError ? (
        <JobError message={listError} retry={refreshList} />
      ) : !page ? (
        <p role="status">Loading resumes…</p>
      ) : !visibleResumes.length ? (
        <div className="empty-state">
          <FileText size={36} aria-hidden="true" />
          <h2>
            {page.totalPages === 0 && page.pageNumber === 1
              ? "Your next opportunity starts with your CV"
              : "No resumes on this page"}
          </h2>
          <p>
            Upload a resume to follow its reading progress, then use it when you
            apply.
          </p>
          <Button onClick={() => setUpload(true)}>
            {page.totalPages === 0
              ? "Upload your first resume"
              : "Upload resume"}
          </Button>
        </div>
      ) : (
        <div className="resume-list">
          {visibleResumes.map((resume) => (
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
                <Button
                  variant="secondary"
                  disabled={!!busy}
                  onClick={() => setDetails(resume.publicId)}
                >
                  View details
                </Button>
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
                {resume.ingestionStatus === "FAILED" && resume.storageKey && (
                  <Button
                    variant="secondary"
                    disabled={!!busy}
                    onClick={() =>
                      void action(resume.publicId, async () => {
                        const storageKey = resume.storageKey;
                        if (!storageKey) return;
                        const reference = await updateResume(
                          resume.publicId,
                          resume.name,
                          storageKey,
                        );
                        rememberResume(reference, { ...resume, storageKey });
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
      {page && <JobPagination page={page} onPage={onPage} />}
      {details && (
        <ResumeDetailsDialog
          key={details}
          publicId={details}
          onClose={() => setDetails("")}
          onFile={(resume, inline) => {
            setDetails("");
            void action(resume.publicId, () => openFile(resume, inline));
          }}
        />
      )}
      {upload && (
        <ResumeUploadDialog
          replacing={upload === true ? undefined : upload}
          onClose={(saved) => {
            setUpload(undefined);
            if (saved) {
              if (upload === true && pageNumber !== 1) onPage(1);
              else refreshList();
            }
          }}
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
                  refreshList();
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
