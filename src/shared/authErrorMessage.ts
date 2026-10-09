import { isAxiosError } from "axios";
import { handleApiError } from "./handleApiError";
export function authErrorMessage(
  error: unknown,
  action: "login" | "register" | "logout",
): string {
  const { statusCode } = handleApiError(error);
  if (statusCode === 409 && action === "register")
    return "This email is already registered. Sign in or use another email.";
  if (statusCode === 401 && action === "login")
    return "Invalid email or password. Check your details and try again.";
  if (statusCode === 400)
    return "Some details weren't accepted. Check your entries and try again.";
  if (statusCode >= 500)
    return "The service is temporarily unavailable. Please try again shortly.";
  if (isAxiosError(error) && !error.response)
    return "We couldn't reach FitWork. Check your connection and try again.";
  return action === "logout"
    ? "You're signed out on this device, but we couldn't end the server session. Check your connection before signing in again."
    : "We couldn't complete your request. Please try again.";
}
