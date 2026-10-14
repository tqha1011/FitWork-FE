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
  jobPublicId: string,
  signal?: AbortSignal,
  evaluationPublicId?: string,
): Promise<EvaluationDetail> {
  return (
    await api.get<EvaluationDetail>(
      `/applicant-evaluation/${encodeURIComponent(jobPublicId)}`,
      {
        signal,
        ...(evaluationPublicId ? { params: { evaluationPublicId } } : {}),
      },
    )
  ).data;
}
export async function getJobOwnerEvaluation(
  jobPublicId: string,
  evaluationPublicId: string,
  signal?: AbortSignal,
): Promise<JobOwnerEvaluation> {
  return (
    await api.get<JobOwnerEvaluation>(
      `/applicant-evaluation/jobs/${encodeURIComponent(jobPublicId)}/${encodeURIComponent(evaluationPublicId)}`,
      { signal },
    )
  ).data;
}
