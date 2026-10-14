import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { Button, ButtonLink, PageHeader } from "../components/ui";
import EvaluationResult from "../components/EvaluationResult";
import { getEvaluation } from "../services/evaluationService";
import { processingErrorMessage } from "../shared/processingErrorMessage";
import type { EvaluationDetail } from "../types/evaluation";

type ResultState =
  | { kind: "idle" | "loading" | "pending" }
  | { kind: "ready"; result: EvaluationDetail }
  | { kind: "error"; message: string; forbidden: boolean };

export default function ApplicantEvaluationPage() {
  const { jobPublicId } = useParams();
  return (
    <ApplicantEvaluationViewer
      key={jobPublicId ? `job:${jobPublicId}` : "lookup"}
      id={jobPublicId}
    />
  );
}

function ApplicantEvaluationViewer({ id }: { id?: string }) {
  const navigate = useNavigate();
  const [input, setInput] = useState(id ?? "");
  const [inputError, setInputError] = useState("");
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<ResultState>({
    kind: id ? "loading" : "idle",
  });
  const loading = state.kind === "loading";
  const forbidden = state.kind === "error" && state.forbidden;

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    void getEvaluation(id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setState({ kind: "ready", result });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const status = isAxiosError(error) ? error.response?.status : undefined;
        if (status === 409) setState({ kind: "pending" });
        else
          setState({
            kind: "error",
            forbidden: status === 403,
            message:
              status === 404
                ? "No evaluation is available for your application to this job. Check the job ID and your application."
                : processingErrorMessage(error),
          });
      });
    return () => controller.abort();
  }, [id, revision]);

  function refresh() {
    if (loading || forbidden) return;
    setState({ kind: "loading" });
    setRevision((value) => value + 1);
  }

  function open(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = input.trim();
    if (!next) {
      setInputError("Enter a job ID.");
      return;
    }
    setInputError("");
    if (next === id) refresh();
    else navigate(`/freelancer/evaluations/${encodeURIComponent(next)}`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Freelancer workspace"
        title="My Evaluations"
        description="View the latest evaluation of your application to a job."
        action={
          <ButtonLink to="/freelancer/applications" variant="secondary">
            My Applications
          </ButtonLink>
        }
      />
      <form className="card evaluation-lookup stack" onSubmit={open}>
        <label className="field" htmlFor="evaluation-id">
          <span className="field-label">Job ID</span>
          <input
            id="evaluation-id"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setInputError("");
            }}
            required
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!inputError}
            aria-describedby={
              inputError
                ? "evaluation-id-hint evaluation-id-error"
                : "evaluation-id-hint"
            }
          />
        </label>
        <p id="evaluation-id-hint" className="field-hint">
          Enter a job ID to view the latest evaluation of your application, or
          view the result directly in My Applications.
        </p>
        {inputError && (
          <p id="evaluation-id-error" className="field-error-text" role="alert">
            {inputError}
          </p>
        )}
        <div className="actions">
          <Button
            type="submit"
            disabled={(loading || forbidden) && input.trim() === id}
          >
            View evaluation
          </Button>
        </div>
      </form>
      {id && (
        <section
          className="card stack"
          aria-label="Your evaluation"
          aria-busy={loading}
        >
          <div className="evaluation-detail-header">
            <p className="application-id">Job ID: {id}</p>
            <Button
              variant="secondary"
              disabled={loading || forbidden}
              onClick={refresh}
            >
              Refresh result
            </Button>
          </div>
          {loading && <p role="status">Loading evaluation…</p>}
          {state.kind === "pending" && (
            <p className="notice" role="status">
              No completed result is available for the latest evaluation yet.
              Refresh later to check again.
            </p>
          )}
          {state.kind === "error" && (
            <p className="job-error" role="alert">
              {state.message}
            </p>
          )}
          {state.kind === "ready" && (
            <>
              <EvaluationResult result={state.result} />
            </>
          )}
        </section>
      )}
    </>
  );
}
