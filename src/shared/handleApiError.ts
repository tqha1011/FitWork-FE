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
      const {
        statusCode,
        message,
        error: errorName,
      } = error.response.data ?? {};
      return {
        statusCode: statusCode ?? error.response.status,
        message: message ?? error.message,
        error: errorName ?? error.response.statusText,
      };
    }

    return {
      statusCode: 0,
      message: error.message || "Network error, please try again.",
      error: "NetworkError",
    };
  }

  return {
    statusCode: 0,
    message: error instanceof Error ? error.message : "Unexpected error.",
    error: "UnknownError",
  };
};
