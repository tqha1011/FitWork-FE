import { useEffect, useId, useRef, useState } from "react";
import axios from "axios";
import { Sparkles } from "lucide-react";
import { Button } from "./ui";
import EvaluationResult from "./EvaluationResult";
import { evaluationKey, useResumes } from "../contexts/resumeContext";
import { createEvaluation, getEvaluation } from "../services/evaluationService";
import {
  watchProcessing,
  type ConnectionState,
} from "../services/processingSocket";
import { processingErrorMessage } from "../shared/processingErrorMessage";
import type { EvaluationDetail, EvaluationState } from "../types/evaluation";

export default function ApplicantEvaluation({
  jobId,
  resumeId,
}: {
  jobId: string;
  resumeId: string;
}) {
  const { resumes, evaluations, rememberEvaluation } = useResumes();
  const resume = resumes.find((item) => item.publicId === resumeId);
  const reference = evaluations[evaluationKey(jobId, resumeId)];
  // Evaluation IDs are only needed for realtime monitoring, not result lookup.
  const id =
    reference && resume?.ingestionPublicId === reference.ingestionPublicId
      ? reference.publicId
      : undefined;
  const resultRegionId = useId();
  const [viewing, setViewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState<EvaluationState>();
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [detail, setDetail] = useState<EvaluationDetail>();
  const [notReady, setNotReady] = useState(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!id || busy) return;
    return watchProcessing(
      "evaluation",
      id,
      (next) => setState(next as EvaluationState),
      setConnection,
    );
  }, [id, attempt, busy]);
  const completedAt =
    state && state.evaluationPublicId === id && state.status === "COMPLETED"
      ? state.updatedAt
      : undefined;
  useEffect(() => {
    if (!viewing || busy) return;
    const controller = new AbortController();
    void getEvaluation(jobId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setDetail(result);
          setNotReady(false);
          setError("");
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        // The newest evaluation can be incomplete even if an older one succeeded.
        setDetail(undefined);
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          setNotReady(true);
          setError("");
        } else {
          setNotReady(false);
          setError(
            axios.isAxiosError(error) && error.response?.status === 404
              ? "No evaluation is available for your application to this job. Check your application or request an evaluation."
              : processingErrorMessage(error),
          );
          if (axios.isAxiosError(error) && error.response?.status === 403)
            setForbidden(true);
        }
      });
    return () => controller.abort();
  }, [jobId, viewing, attempt, completedAt, refresh, busy]);

  function refreshResult() {
    if (busy || forbidden) return;
    setDetail(undefined);
    setError("");
    setNotReady(false);
    setViewing(true);
    setRefresh((value) => value + 1);
  }

  async function start() {
    if (
      !resume ||
      !resume.ingestionPublicId ||
      resume.ingestionStatus !== "COMPLETED" ||
      busy ||
      forbidden
    )
      return;
    setBusy(true);
    setViewing(true);
    setError("");
    setDetail(undefined);
    setState(undefined);
    setNotReady(false);
    setConnection("connecting");
    try {
      const response = await createEvaluation(resumeId, jobId);
      if (!mounted.current) return;
      if (!response.publicId)
        throw new Error("Unable to load this evaluation. Please try again.");
      rememberEvaluation(jobId, resume, response.publicId);
      setAttempt((value) => value + 1);
    } catch (error) {
      if (mounted.current) {
        setError(processingErrorMessage(error));
        if (axios.isAxiosError(error) && error.response?.status === 403)
          setForbidden(true);
        // An unsuccessful creation must not trigger a GET that hides its error.
        setViewing(false);
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  const current = !busy && state?.evaluationPublicId === id ? state : undefined;
  const result = !busy && viewing ? detail : undefined;
  const loading = viewing && !busy && !result && !error && !notReady;
  return (
    <section
      className="application-evaluation stack"
      aria-label="Resume evaluation"
    >
      <h3>
        <Sparkles size={18} aria-hidden="true" /> Resume evaluation
      </h3>
      <div className="actions">
        <Button
          variant="secondary"
          disabled={busy || (!viewing && forbidden)}
          aria-expanded={viewing}
          aria-controls={resultRegionId}
          onClick={() => {
            if (viewing) setViewing(false);
            else refreshResult();
          }}
        >
          {viewing ? "Hide evaluation" : "View evaluation"}
        </Button>
      </div>
      {!resume ? (
        <p className="muted">
          Select a resume in My Resumes to request a new evaluation.
        </p>
      ) : !id ? (
        <>
          {resume.ingestionStatus !== "COMPLETED" && (
            <p role="status">
              {resume.ingestionStatus === "FAILED"
                ? resume.storageKey
                  ? "Resume reading failed. Retry reading or replace the file in My Resumes."
                  : "Resume reading failed. Replace the file in My Resumes."
                : "Evaluation becomes available when resume reading is complete."}
            </p>
          )}
          <Button
            disabled={
              busy || forbidden || resume.ingestionStatus !== "COMPLETED"
            }
            onClick={() => void start()}
          >
            {busy ? "Requesting evaluation…" : "Evaluate this application"}
          </Button>
        </>
      ) : null}
      {viewing && (
        <div
          id={resultRegionId}
          className="evaluation-readout stack"
          aria-busy={loading || busy}
        >
          {busy && <p role="status">Requesting evaluation…</p>}
          {!result &&
            current &&
            (!notReady || current.status !== "COMPLETED") && (
              <>
                <p role="status">
                  {current.status === "FAILED"
                    ? "Evaluation failed"
                    : current.status === "COMPLETED"
                      ? "Evaluation completed. Loading the result…"
                      : current.status === "PROCESSING"
                        ? "Evaluating your resume…"
                        : "Evaluation queued"}
                </p>
                {current.errorMessage && (
                  <p className="field-error-text">{current.errorMessage}</p>
                )}
              </>
            )}
          {loading && <p role="status">Loading evaluation…</p>}
          {notReady && (
            <p className="notice" role="status">
              No completed result is available for the latest evaluation yet.
              Refresh later to check again.
            </p>
          )}
          {result && (
            <>
              <EvaluationResult result={result} />
            </>
          )}
          <div className="actions">
            <Button
              variant="secondary"
              disabled={busy || loading || forbidden}
              onClick={refreshResult}
            >
              Refresh result
            </Button>
            {id && connection !== "connected" && (
              <Button
                variant="secondary"
                disabled={busy || forbidden}
                onClick={() => setAttempt((value) => value + 1)}
              >
                Reconnect
              </Button>
            )}
            {current?.status === "FAILED" && resume && (
              <Button
                disabled={
                  busy || forbidden || resume.ingestionStatus !== "COMPLETED"
                }
                onClick={() => void start()}
              >
                Retry evaluation
              </Button>
            )}
          </div>
          {id && !result && connection === "uncertain" && (
            <p className="notice">
              Could not update the evaluation. Please retry.
            </p>
          )}
          {id && !result && connection === "denied" && (
            <p className="job-error">
              Unable to update this evaluation. Please retry.
            </p>
          )}
        </div>
      )}
      {error && (
        <p className="job-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
