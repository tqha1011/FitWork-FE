import { isAxiosError } from "axios";
export function isUncertainMutation(error: unknown): boolean {
  return (
    isAxiosError(error) && (!error.response || error.response.status >= 500)
  );
}
export function jobErrorMessage(error: unknown, mutation = false): string {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  const message =
    mutation && isUncertainMutation(error)
      ? "Your request may have succeeded. Check your saved changes before trying again."
      : status === 400
        ? "Some values were not accepted. Check your entries and try again."
        : status === 401
          ? "Your session has ended. Please sign in again."
          : status === 403
            ? "You do not have permission to perform this action."
            : status === 404
              ? "The requested information is unavailable."
              : status && status >= 500
                ? "FitWork is temporarily unavailable. Please retry."
                : error instanceof Error && !isAxiosError(error)
                  ? error.message
                  : "We could not reach FitWork. Check your connection and retry.";
  return message;
}
