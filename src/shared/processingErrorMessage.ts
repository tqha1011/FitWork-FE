import { isAxiosError } from "axios";
import { jobErrorMessage, isUncertainMutation } from "./jobErrorMessage.ts";
export function processingErrorMessage(
  error: unknown,
  mutation = false,
): string {
  if (mutation && isUncertainMutation(error))
    return jobErrorMessage(error, true);
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (message === "Job application not found")
      return "Apply to this job using this resume before requesting an evaluation.";
    if (message === "Resume ingestion must be completed before evaluation")
      return "Resume reading is not complete. Wait for a confirmed ready status before evaluating.";
    if (message === "User credentials not valid")
      return "This resume is no longer available for your account. Use a current resume belonging to you.";
    if (
      error.response?.status === 400 &&
      typeof message === "string" &&
      message !== "Bad Request Exception"
    )
      return message;
  }
  return jobErrorMessage(error, mutation);
}
