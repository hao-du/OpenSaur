import { httpClient, type OpenSaurRequestConfig } from "../../../shared/api/httpClient";
import type {
  AssignmentCandidate,
  RoleAssignmentSummary
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

export async function getRoleAssignments(roleId: string) {
  return await unwrapData<RoleAssignmentSummary[]>(
    httpClient.get(`/api/user-role/getbyrole/${roleId}`)
  );
}

export async function getAssignmentCandidates() {
  return await unwrapData<AssignmentCandidate[]>(
    httpClient.get("/api/user-role/getcandidates")
  );
}

export async function createUserRoleAssignment(request: { description: string; roleId: string; userId: string; }) {
  return await unwrapData<{ id: string; }>(
    httpClient.post("/api/user-role/create", request, {
      idempotent: true
    } as OpenSaurRequestConfig)
  );
}

export async function editUserRoleAssignment(request: {
  description: string;
  id: string;
  isActive: boolean;
  roleId: string;
}) {
  await httpClient.put("/api/user-role/edit", request, {
    idempotent: true
  } as OpenSaurRequestConfig);
}
