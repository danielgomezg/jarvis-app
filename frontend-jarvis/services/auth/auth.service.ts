import { api, nextApi, apiPrivate } from "@/lib/api";
import {
  RegisterDto,
  RegisterResponse,
  LoginDto,
  LoginResponse,
  ConfirmationDto,
  ConfirmationResponse,
} from "@/types/auth/auth.types";

export const AuthService = {
  register: (data: RegisterDto) =>
    api.post<RegisterResponse>("/auth/register", data),
  login: (data: LoginDto) =>
    nextApi.post<LoginResponse>("/api/auth/login", data), //Route Handler
  loginOAuth: (nameOAuth: string) => api.get(`/auth/${nameOAuth}`),
  confirmation: (data: ConfirmationDto) =>
    api.post<ConfirmationResponse>(`/auth/resend-verification`, data),
  verifyEmail: (token: string) => api.get(`/auth/verify-email?token=${token}`),
  logout: () => nextApi.post("/api/auth/logout"), //Route Handler
  refresh: () => nextApi.post("/api/auth/refresh"), //refresca tokens
};
