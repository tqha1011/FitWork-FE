import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Dialog, Field } from "./ui";
import {
  createResume,
  requestResumeUpload,
  updateResume,
  uploadResumeFile,
} from "../services/resumeService";
import { resumeContentType } from "../shared/jobValidation";
import { isUncertainMutation } from "../shared/jobErrorMessage";
import { processingErrorMessage } from "../shared/processingErrorMessage";
import { useResumes, type SessionResume } from "../contexts/resumeContext";
export default function ResumeUploadDialog({
  replacing,
  onClose,
}: {
  replacing?: SessionResume;
  onClose: (saved?: boolean) => void;
}) {
  const { rememberResume } = useResumes();
  const [name, setName] = useState(replacing?.name ?? "");
  const [file, setFile] = useState<File>();
  const [key, setKey] = useState<string>();
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [uncertain, setUncertain] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const busy = !!stage;
  useEffect(() => {
    controller.current = new AbortController();
    return () => controller.current?.abort();
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || uncertain) return;
    setError("");
    if (!file || !name.trim()) {
      setError("Choose a PDF or DOCX and enter a resume name.");
      return;
    }
    let registering = false;
    try {
      const contentType = resumeContentType(file);
      let storageKey = key;
      if (!storageKey) {
        setStage("Preparing upload…");
        const upload = await requestResumeUpload(
          file,
          controller.current?.signal,
        );
        setStage("Uploading file…");
        await uploadResumeFile(
          upload.uploadUrl,
          file,
          setProgress,
          controller.current?.signal,
        );
        storageKey = upload.storageKey;
        setKey(storageKey);
      }
      setStage("Saving resume…");
      registering = true;
      const reference = replacing
        ? await updateResume(
            replacing.publicId,
            name,
            storageKey,
            controller.current?.signal,
          )
        : await createResume(
            name.trim(),
            storageKey,
            controller.current?.signal,
          );
      if (!reference.publicId || !reference.ingestionPublicId)
        throw new Error("Unable to confirm the saved resume.");
      rememberResume(reference, {
        name: name.trim(),
        storageKey,
        contentType,
        size: file.size,
      });
      onClose(true);
    } catch (error) {
      if (controller.current?.signal.aborted) return;
      if (
        registering &&
        (isUncertainMutation(error) ||
          (error instanceof Error &&
            error.message.includes("Unable to confirm the saved resume")))
      )
        setUncertain(true);
      setError(processingErrorMessage(error, registering));
    } finally {
      setStage("");
    }
  }
  return (
    <Dialog
      open
      title={replacing ? "Replace resume" : "Upload resume"}
      onClose={() => {
        if (!busy) onClose();
      }}
      className="job-apply-dialog"
    >
      <form className="stack" onSubmit={submit} noValidate>
        <p className="muted">PDF or DOCX, up to 5 MiB.</p>
        <fieldset
          className="job-form-fields stack"
          disabled={busy || uncertain}
        >
          <Field label="Resume name">
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </Field>
          <Field label="Resume file" hint="PDF or DOCX, 1 byte to 5 MiB.">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(event) => {
                const next = event.target.files?.[0];
                setKey(undefined);
                setFile(undefined);
                setError("");
                setProgress(0);
                if (next) {
                  try {
                    resumeContentType(next);
                    setFile(next);
                    if (!name) setName(next.name);
                  } catch (error) {
                    setError(processingErrorMessage(error));
                  }
                }
              }}
            />
          </Field>
        </fieldset>
        {busy && (
          <div role="status" className="upload-status">
            <p>{stage}</p>
            <progress aria-label="Upload progress" value={progress} max={100} />
            <span>{progress}%</span>
          </div>
        )}
        {error && (
          <p className="job-error" role="alert">
            {error}
          </p>
        )}
        {uncertain && (
          <p className="notice">
            The resume may already have been saved. Check My Resumes before
            uploading again.
          </p>
        )}
        <div className="dialog-actions">
          <Button variant="secondary" disabled={busy} onClick={() => onClose()}>
            Close
          </Button>
          <Button type="submit" disabled={busy || uncertain}>
            {busy
              ? "Uploading…"
              : replacing
                ? "Save replacement"
                : "Upload resume"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
