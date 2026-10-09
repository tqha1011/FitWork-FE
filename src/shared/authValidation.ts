import type { LoginRequest, RegisterRequest } from "../types/auth.ts";
export type AuthFieldErrors = Partial<Record<keyof RegisterRequest, string>>;
export function validateLogin(input: LoginRequest): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
    errors.email = "Enter a valid email address.";
  if (!input.password.length) errors.password = "Enter your password.";
  return errors;
}
export function validateRegistration(input: RegisterRequest): AuthFieldErrors {
  const errors = validateLogin(input);
  if (input.username.trim().length < 3)
    errors.username = "Use at least 3 characters.";
  if (!input.fullName.trim()) errors.fullName = "Enter your full name.";
  if (
    input.password.length < 8 ||
    !/[a-z]/.test(input.password) ||
    !/[A-Z]/.test(input.password) ||
    !/\d/.test(input.password) ||
    !/[^A-Za-z0-9]/.test(input.password)
  )
    errors.password =
      "Use at least 8 characters, including uppercase, lowercase, a number, and a special character.";
  if (!["APPLICANT", "COMPANY"].includes(input.userType))
    errors.userType = "Choose an account type.";
  return errors;
}
