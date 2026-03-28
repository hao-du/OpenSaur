import { httpClient, type OpenSaurRequestConfig } from "../../../shared/api/httpClient";
import type {
  CreateRoleRequest,
  CreateRoleResponse,
  EditRoleRequest,
  PermissionSummary,
  RoleDetails,
  RoleSummary
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

export async function getRoles() {
  return await unwrapData<RoleSummary[]>(httpClient.get("/api/role/get"));
}

export async function getRoleById(roleId: string) {
  return await unwrapData<RoleDetails>(httpClient.get(`/api/role/getbyid/${roleId}`));
}

export async function getPermissions() {
  return await unwrapData<PermissionSummary[]>(httpClient.get("/api/permission/get"));
}

export async function createRole(request: CreateRoleRequest) {
  return await unwrapData<CreateRoleResponse>(httpClient.post("/api/role/create", request, {
    idempotent: true
  } as OpenSaurRequestConfig));
}

export async function editRole(request: EditRoleRequest) {
  await httpClient.put("/api/role/edit", request, {
    idempotent: true
  } as OpenSaurRequestConfig);
}
