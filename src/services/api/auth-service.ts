import { http } from "./http-client";
import type { LoginResponse } from "@/services/session/session-service";

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  password: string;
  invitationToken: string;
}

export interface RegisterResponse {
  email: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export function registerUser(data: RegisterRequest) {
  return http<RegisterResponse>("/api/v1/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify(data),
  });
}

export function logoutUser(data: RefreshTokenRequest) {
  return http<void>("/api/v1/auth/logout", {
    method: "POST",
    auth: false,
    body: JSON.stringify(data),
  });
}

export function loginUser(data: LoginRequest) {
  return http<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify(data),
  });
}
