import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Button, PageHeader } from "../components/ui";
import EvaluationResult from "../components/EvaluationResult";
import { getJobOwnerEvaluation } from "../services/evaluationService";
import { processingErrorMessage } from "../shared/processingErrorMessage";
import type { JobOwnerEvaluation } from "../types/evaluation";
export default function CompanyEvaluationPage() {
  const { jobPublicId, evaluationPublicId } = useParams();
  return (
    <CompanyEvaluation
      key={`${jobPublicId}:${evaluationPublicId}`}
      jobPublicId={jobPublicId}
      evaluationPublicId={evaluationPublicId}
    />
  );
}
function CompanyEvaluation({
  jobPublicId,
  evaluationPublicId,
}: {
  jobPublicId?: string;
  evaluationPublicId?: string;
}) {
  const [result, setResult] = useState<JobOwnerEvaluation>();
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(!!jobPublicId && !!evaluationPublicId);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!jobPublicId || !evaluationPublicId) return;
    const controller = new AbortController();
    void getJobOwnerEvaluation(
      jobPublicId,
      evaluationPublicId,
      controller.signal,
    )
      .then((detail) => {
        if (!controller.signal.aborted) {
          if (!("decisionSupportOnly" in detail))
            throw new Error(
              "Unable to load this evaluation. Please try again.",
            );
          setResult(detail);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          if (axios.isAxiosError(error) && error.response?.status === 403)
            setForbidden(true);
          setError(
            axios.isAxiosError(error) && error.response?.status === 409
              ? "No completed result is available yet. Refresh later."
              : processingErrorMessage(error),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [jobPublicId, evaluationPublicId, revision]);
  return (
    <>
      <PageHeader
        title="Applicant evaluation"
        description="Review the evidence behind the applicant’s score."
        action={
          jobPublicId && evaluationPublicId ? (
            <Button
              variant="secondary"
              disabled={loading || forbidden}
              onClick={() => {
                setLoading(true);
                setError("");
                setResult(undefined);
                setRevision((value) => value + 1);
              }}
            >
              Refresh result
            </Button>
          ) : undefined
        }
      />
      {!jobPublicId || !evaluationPublicId ? (
        <div className="empty-state">
          <h2>Applicant results are not available yet</h2>
        </div>
      ) : (
        <>
          {loading && <p role="status">Loading evaluation…</p>}
          {error && (
            <p className="job-error" role="alert">
              {error}
            </p>
          )}
          {result && (
            <div className="card">
              <EvaluationResult result={result} />
            </div>
          )}
        </>
      )}
    </>
  );
}
