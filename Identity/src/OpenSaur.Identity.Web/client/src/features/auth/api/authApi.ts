import { httpClient } from "../../../shared/api/httpClient";

export type LoginRequest = {
  password: string;
  userName: string;
};

export async function login(request: LoginRequest) {
  return await httpClient.post("/api/auth/login", request);
}

export async function logout() {
  return await httpClient.post("/api/auth/logout");
}

export async function getCurrentUser() {
  return await httpClient.get("/api/auth/me");
}
