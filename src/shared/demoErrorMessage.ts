import { isAxiosError } from "axios";
export function demoErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 429)
      return "Demo quota reached. You can still open sample results. Try again when the server quota resets.";
    if (error.response?.status === 503)
      return "Live AI is unavailable or not configured. Sample results are still available.";
    if (error.response?.status === 409)
      return "This evaluation is not ready yet. Open a sample result while AI is processing, then refresh.";
    if (error.response?.status === 404)
      return "This demo resource is unavailable. Check that the dedicated demo backend is enabled.";
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
  }
  return error instanceof Error
    ? error.message
    : "Unable to complete this action. Please retry.";
}
