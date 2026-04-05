import { httpClient } from "../../../shared/api/httpClient";

export type LoginRequest = {
  password: string;
  userName: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type AuthMeResponse = {
  canManageUsers?: boolean;
  email?: string;
  firstName?: string;
  id: string;
  isImpersonating: boolean;
  lastName?: string;
  requirePasswordChange: boolean;
  roles: string[];
  userName: string;
  workspaceName: string;
};

export type CurrentUserSettingsResponse = {
  locale: string | null;
  timeZone: string | null;
};

export type DashboardSummaryResponse = {
  activeUserCount: number;
  activeWorkspaceCount: number;
  availableRoleCount: number;
  inactiveUserCount: number;
  maxActiveUsers: number | null;
  scope: "global" | "workspace";
  workspaceCount: number;
  workspaceName: string | null;
};

export type UpdateCurrentUserSettingsRequest = {
  locale: "en" | "vi";
  timeZone: string;
};

export type ExchangeWebSessionRequest = {
  code: string;
};

export type ExchangeWebSessionResponse = {
  accessToken: string;
  expiresAt: string;
};

export type ImpersonationOptionsResponse = {
  users: ImpersonationOptionsUser[];
  workspaceId: string;
  workspaceName: string;
};

export type ImpersonationOptionsUser = {
  email: string;
  id: string;
  userName: string;
};

export type StartImpersonationRequest = {
  returnUrl: string;
  userId: string | null;
  workspaceId: string;
};

export type ExitImpersonationRequest = {
  returnUrl: string;
};

export type ImpersonationRedirectResponse = {
  redirectUrl: string;
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

export async function changePassword(request: ChangePasswordRequest) {
  return await httpClient.post("/api/auth/change-password", request);
}

export async function getCurrentUser() {
  return await unwrapData<AuthMeResponse>(httpClient.get("/api/auth/me"));
}

export async function getCurrentUserSettings() {
  return await unwrapData<CurrentUserSettingsResponse>(httpClient.get("/api/auth/settings"));
}

export async function getDashboardSummary() {
  return await unwrapData<DashboardSummaryResponse>(httpClient.get("/api/auth/dashboard"));
}

export async function exchangeWebSession(request: ExchangeWebSessionRequest) {
  return await unwrapData<ExchangeWebSessionResponse>(
    httpClient.post("/api/auth/web-session/exchange", request)
  );
}

export async function refreshWebSession() {
  return await unwrapData<ExchangeWebSessionResponse>(
    httpClient.post("/api/auth/web-session/refresh")
  );
}

export async function getImpersonationOptions(workspaceId: string) {
  return await unwrapData<ImpersonationOptionsResponse>(
    httpClient.get(`/api/auth/impersonation/options/${workspaceId}`)
  );
}

export async function startImpersonation(request: StartImpersonationRequest) {
  return await unwrapData<ImpersonationRedirectResponse>(
    httpClient.post("/api/auth/impersonation/start", request)
  );
}

export async function exitImpersonation(request: ExitImpersonationRequest) {
  return await unwrapData<ImpersonationRedirectResponse>(
    httpClient.post("/api/auth/impersonation/exit", request)
  );
}

export async function updateCurrentUserSettings(request: UpdateCurrentUserSettingsRequest) {
  return await unwrapData<CurrentUserSettingsResponse>(
    httpClient.put("/api/auth/settings", request)
  );
}
