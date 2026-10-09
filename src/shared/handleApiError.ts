import { isAxiosError } from "axios";

import type { ApiErrorResponse } from "../types/commonTypes";

/**
 * Normalizes any error thrown by an axios call (server response error or
 * network error) into a single ApiErrorResponse shape so callers never have
 * to deal with a raw AxiosError.
 */
export const handleApiError = (error: unknown): ApiErrorResponse => {
  if (isAxiosError<Partial<ApiErrorResponse>>(error)) {
    if (error.response) {
      const { statusCode, message, timestamp, path } =
        error.response.data ?? {};
      return {
        statusCode: statusCode ?? error.response.status,
        message: message ?? error.message,
        timestamp: timestamp ?? new Date().toISOString(),
        path: path ?? error.config?.url ?? "",
      };
    }

    return {
      statusCode: 0,
      message: error.message || "Network error, please try again.",
      timestamp: new Date().toISOString(),
      path: error.config?.url ?? "",
    };
  }

  return {
    statusCode: 0,
    message: error instanceof Error ? error.message : "Unexpected error.",
    timestamp: new Date().toISOString(),
    path: "",
  };
};
