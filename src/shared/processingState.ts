import type {
  EvaluationState,
  ResumeIngestionState,
} from "../types/evaluation.ts";

export function acceptProcessingState(
  target: string | { publicId: string; ingestionPublicId: string },
  previous: EvaluationState | ResumeIngestionState | undefined,
  next: EvaluationState | ResumeIngestionState,
): boolean {
  if (typeof target === "string") {
    if (!("evaluationPublicId" in next) || next.evaluationPublicId !== target)
      return false;
  } else if (
    !("resumePublicId" in next) ||
    next.resumePublicId !== target.publicId ||
    next.ingestionPublicId !== target.ingestionPublicId
  )
    return false;
  if (!["PENDING", "PROCESSING", "COMPLETED", "FAILED"].includes(next.status))
    return false;
  const time = Date.parse(next.updatedAt);
  if (!Number.isFinite(time)) return false;
  if (previous) {
    const last = Date.parse(previous.updatedAt);
    if (time < last) return false;
    if (
      time === last &&
      (previous.status === "COMPLETED" || previous.status === "FAILED") &&
      next.status !== previous.status
    )
      return false;
  }
  return true;
}
export const processingLabels = {
  PENDING: "Waiting to read",
  PROCESSING: "Reading resume",
  COMPLETED: "Ready to use",
  FAILED: "Reading failed",
};
