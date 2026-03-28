import { httpClient, type OpenSaurRequestConfig } from "../../../shared/api/httpClient";
import type {
  CreateUserRequest,
  CreateUserResponse,
  EditUserRequest,
  RoleCandidateSummary,
  UserAssignmentSummary,
  UserDetails,
  UserSummary
} from "../types";

type ApiEnvelope<TData> = {
  data: TData | null;
  errors: Array<{
    code: string;
    detail: string;
    message: string;
  }>;
  success: boolean;
};

async function unwrapData<TData>(request: Promise<{ data: ApiEnvelope<TData>; }>) {
  const response = await request;
  if (!response.data.success || response.data.data == null) {
    throw new Error("The API response did not contain success data.");
  }

  return response.data.data;
}

export async function getUsers() {
  return await unwrapData<UserSummary[]>(httpClient.get("/api/user/get"));
}

export async function getUserById(userId: string) {
  return await unwrapData<UserDetails>(httpClient.get(`/api/user/getbyid/${userId}`));
}

export async function createUser(request: CreateUserRequest) {
  return await unwrapData<CreateUserResponse>(httpClient.post("/api/user/create", request, {
    idempotent: true
  } as OpenSaurRequestConfig));
}

export async function editUser(request: EditUserRequest) {
  await httpClient.put("/api/user/edit", request, {
    idempotent: true
  } as OpenSaurRequestConfig);
}

export async function getUserAssignments(userId: string) {
  return await unwrapData<UserAssignmentSummary[]>(httpClient.get(`/api/user-role/getbyuser/${userId}`));
}

export async function getRoleCandidates() {
  return await unwrapData<RoleCandidateSummary[]>(httpClient.get("/api/user-role/getrolecandidates"));
}
