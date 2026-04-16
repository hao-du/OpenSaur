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

export async function canAccessChangePassword(): Promise<boolean> {
  const response = await fetch("/auth/change-password/access", {
    method: "GET"
  });

  if (response.status === 204) {
    return true;
  }

  if (response.status === 403) {
    return false;
  }

  throw new Error("Unable to determine change password access.");
}
