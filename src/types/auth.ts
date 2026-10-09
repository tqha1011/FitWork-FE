export type UserType = "APPLICANT" | "COMPANY";
export type AccountRole = "freelancer" | "client";
export interface LoginRequest {
  email: string;
  password: string;
}
export interface RegisterRequest extends LoginRequest {
  username: string;
  fullName: string;
  userType: UserType;
}
export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}
export interface AuthSession {
  accessToken: string;
  expiresAt: number;
  user: { publicId: string; email: string; role: AccountRole };
}
export interface ApiError {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
}
