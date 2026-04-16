import type { ChangePasswordRequest } from "../dtos/ChangePasswordRequest";
import type { ChangePasswordResponse } from "../dtos/ChangePasswordResponse";
import type { LoginRequest } from "../dtos/LoginRequest";
import type { LoginResponse } from "../dtos/LoginResponse";

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return (await response.json()) as LoginResponse;
}

export async function changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  const response = await fetch("/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return (await response.json()) as ChangePasswordResponse;
}
