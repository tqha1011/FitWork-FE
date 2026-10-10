import { api } from "./api.ts";
import type {
  EvaluationDetail,
  JobOwnerEvaluation,
} from "../types/evaluation.ts";
export async function createEvaluation(
  resumePublicId: string,
  jobPublicId: string,
): Promise<{ publicId: string }> {
  return (
    await api.post<{ publicId: string }>("/applicant-evaluation", {
      resumePublicId,
      jobPublicId,
    })
  ).data;
}
export async function getEvaluation(
  evaluationPublicId: string,
  jobPublicId?: string,
  signal?: AbortSignal,
): Promise<EvaluationDetail | JobOwnerEvaluation> {
  const path = jobPublicId
    ? `/applicant-evaluation/jobs/${encodeURIComponent(jobPublicId)}/${encodeURIComponent(evaluationPublicId)}`
    : `/applicant-evaluation/${encodeURIComponent(evaluationPublicId)}`;
  return (
    await api.get<EvaluationDetail | JobOwnerEvaluation>(path, { signal })
  ).data;
}
