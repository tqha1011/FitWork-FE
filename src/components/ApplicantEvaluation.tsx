import { useEffect, useRef, useState } from "react";
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
  const id =
    reference && resume?.ingestionPublicId === reference.ingestionPublicId
      ? reference.publicId
      : undefined;
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
    if (!id || busy) return;
    const controller = new AbortController();
    void getEvaluation(id, undefined, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setDetail(result);
          setNotReady(false);
          setError("");
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (axios.isAxiosError(error) && error.response?.status === 409)
          setNotReady(true);
        else {
          setError(processingErrorMessage(error));
          if (axios.isAxiosError(error) && error.response?.status === 403)
            setForbidden(true);
        }
      });
    return () => controller.abort();
  }, [id, attempt, completedAt, refresh, busy]);
  async function start() {
    if (!resume || resume.ingestionStatus !== "COMPLETED" || busy || forbidden)
      return;
    setBusy(true);
    setError("");
    setDetail(undefined);
    setState(undefined);
    setNotReady(false);
    setConnection("connecting");
    try {
      const response = await createEvaluation(resumeId, jobId);
      if (!mounted.current) return;
      if (!response.publicId)
        throw new Error("The evaluation reference is unavailable.");
      rememberEvaluation(jobId, resume, response.publicId);
      setAttempt((value) => value + 1);
    } catch (error) {
      if (mounted.current) {
        setError(processingErrorMessage(error));
        if (axios.isAxiosError(error) && error.response?.status === 403)
          setForbidden(true);
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  const current = !busy && state?.evaluationPublicId === id ? state : undefined;
  const result = !busy && detail?.publicId === id ? detail : undefined;
  return (
    <section
      className="application-evaluation stack"
      aria-label="Resume evaluation"
    >
      <h3>
        <Sparkles size={18} aria-hidden="true" /> Resume evaluation
      </h3>
      {!resume ? (
        <p className="muted">
          This session has no ingestion reference for the applied resume.
          Evaluation requires that reference; complete resume recovery depends
          on a backend API.
        </p>
      ) : !id ? (
        <>
          <p className="muted">
            Compare the resume used in this application with the job’s
            structured skills.
          </p>
          {resume.ingestionStatus !== "COMPLETED" && (
            <p role="status">
              {resume.ingestionStatus === "FAILED"
                ? "Resume reading failed. Retry reading in My Resumes."
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
      ) : (
        <>
          {result ? (
            <EvaluationResult result={result} />
          ) : (
            <>
              <p role="status">
                {current?.status === "FAILED"
                  ? "Evaluation failed"
                  : current?.status === "COMPLETED"
                    ? "Evaluation completed. Loading the result…"
                    : current?.status === "PROCESSING"
                      ? "Evaluating your resume…"
                      : current?.status === "PENDING"
                        ? "Evaluation queued"
                        : "Checking evaluation status…"}
              </p>
              {current?.overallScore !== undefined && (
                <p>Overall score: {current.overallScore}/100</p>
              )}
              {current?.errorMessage && (
                <p className="field-error-text">{current.errorMessage}</p>
              )}
              {connection === "uncertain" && (
                <p className="notice">
                  Live updates are unavailable or overdue. The evaluation
                  outcome is not confirmed.
                </p>
              )}
              {connection === "denied" && (
                <p className="job-error">
                  Unable to subscribe to this evaluation. Check your access.
                </p>
              )}
              {notReady && (
                <p className="muted">
                  No result is available from the API yet. This does not confirm
                  whether the task is running or has failed.
                </p>
              )}
              <div className="actions">
                <Button
                  variant="secondary"
                  disabled={forbidden}
                  onClick={() => setRefresh((value) => value + 1)}
                >
                  Refresh result
                </Button>
                {connection !== "connected" && (
                  <Button
                    variant="secondary"
                    disabled={forbidden}
                    onClick={() => setAttempt((value) => value + 1)}
                  >
                    Reconnect
                  </Button>
                )}
                {current?.status === "FAILED" && (
                  <Button
                    disabled={
                      busy ||
                      forbidden ||
                      resume.ingestionStatus !== "COMPLETED"
                    }
                    onClick={() => void start()}
                  >
                    {busy ? "Requesting…" : "Retry evaluation"}
                  </Button>
                )}
              </div>
            </>
          )}
        </>
      )}
      {error && (
        <p className="job-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
