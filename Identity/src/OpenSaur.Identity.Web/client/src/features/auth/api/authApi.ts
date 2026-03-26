import { httpClient } from "../../../shared/api/httpClient";

export type LoginRequest = {
  password: string;
  userName: string;
};

export type AuthMeResponse = {
  id: string;
  requirePasswordChange: boolean;
  roles: string[];
  userName: string;
};

export type ExchangeWebSessionRequest = {
  code: string;
};

export type ExchangeWebSessionResponse = {
  accessToken: string;
  expiresAt: string;
};

type ApiEnvelope<TData> = {
  data: TData | null;
  errors: Array<{
    code: string;
    detail: string;
    message: string;
  }>;
  success: boolean;
};

async function unwrapData<TData>(request: Promise<{ data: ApiEnvelope<TData> }>) {
  const response = await request;
  if (!response.data.success || response.data.data == null) {
    throw new Error("The API response did not contain success data.");
  }

  return response.data.data;
}

export async function login(request: LoginRequest) {
  return await httpClient.post("/api/auth/login", request);
}

export async function logout() {
  return await httpClient.post("/api/auth/logout");
}

export async function getCurrentUser() {
  return await unwrapData<AuthMeResponse>(httpClient.get("/api/auth/me"));
}

export async function exchangeWebSession(request: ExchangeWebSessionRequest) {
  return await unwrapData<ExchangeWebSessionResponse>(
    httpClient.post("/api/auth/web-session/exchange", request)
  );
}
