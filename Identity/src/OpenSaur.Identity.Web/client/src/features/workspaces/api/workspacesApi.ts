import { httpClient, type OpenSaurRequestConfig } from "../../../shared/api/httpClient";
import type {
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  EditWorkspaceRequest,
  WorkspaceDetails,
  WorkspaceSummary
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

export async function getWorkspaces() {
  return await unwrapData<WorkspaceSummary[]>(httpClient.get("/api/workspace/get"));
}

export async function getWorkspaceById(id: string) {
  return await unwrapData<WorkspaceDetails>(httpClient.get(`/api/workspace/getbyid/${id}`));
}

export async function createWorkspace(request: CreateWorkspaceRequest) {
  return await unwrapData<CreateWorkspaceResponse>(httpClient.post("/api/workspace/create", request, {
    idempotent: true
  } as OpenSaurRequestConfig));
}

export async function editWorkspace(request: EditWorkspaceRequest) {
  await httpClient.put("/api/workspace/edit", request, {
    idempotent: true
  } as OpenSaurRequestConfig);
}
