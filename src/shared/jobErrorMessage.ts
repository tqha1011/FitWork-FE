import { isAxiosError } from "axios";
export function isUncertainMutation(error: unknown): boolean {
  return (
    isAxiosError(error) && (!error.response || error.response.status >= 500)
  );
}
export function jobErrorMessage(error: unknown, mutation = false): string {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  let message =
    mutation && isUncertainMutation(error)
      ? "The result is uncertain. Your request may have succeeded. It was not sent again automatically."
      : status === 400
        ? "Some values were not accepted. Check your entries and try again."
        : status === 401
          ? "Your session has ended. Please sign in again."
          : status === 403
            ? "You do not have permission to perform this action."
            : status === 404
              ? "The requested job, resume or reference information is unavailable."
              : status && status >= 500
                ? "FitWork is temporarily unavailable. Please retry."
                : error instanceof Error && !isAxiosError(error)
                  ? error.message
                  : "We could not reach FitWork. Check your connection and retry.";
  const requestId = isAxiosError(error)
    ? Object.entries(error.response?.headers ?? {}).find(
        ([name]) => name.toLowerCase() === "x-request-id",
      )?.[1]
    : undefined;
  if (typeof requestId === "string") message += ` Request ID: ${requestId}`;
  return message;
}
