import axios from "axios";
import { getAuthSession } from "../../auth/storages/authStorage";
import type { AssignableWorkspaceRoleDto } from "../dtos/AssignableWorkspaceRoleDto";
import type { CreateWorkspaceRequestDto } from "../dtos/CreateWorkspaceRequestDto";
import type { CreateWorkspaceResponseDto } from "../dtos/CreateWorkspaceResponseDto";
import type { EditWorkspaceRequestDto } from "../dtos/EditWorkspaceRequestDto";
import type { WorkspaceDetailsDto } from "../dtos/WorkspaceDetailsDto";
import type { WorkspaceSummaryDto } from "../dtos/WorkspaceSummaryDto";

function createRequestConfig() {
  const authSession = getAuthSession();

  return {
    headers: authSession == null
      ? undefined
      : {
          Authorization: `Bearer ${authSession.accessToken}`
        }
  };
}

export async function getWorkspaces() {
  const response = await axios.get<WorkspaceSummaryDto[]>("/api/workspace/get", createRequestConfig());
  return response.data;
}

export async function getWorkspaceById(workspaceId: string) {
  const response = await axios.get<WorkspaceDetailsDto>(`/api/workspace/getbyid/${workspaceId}`, createRequestConfig());
  return response.data;
}

export async function getAssignableWorkspaceRoles() {
  const response = await axios.get<AssignableWorkspaceRoleDto[]>("/api/workspace/roles", createRequestConfig());
  return response.data;
}

export async function createWorkspace(request: CreateWorkspaceRequestDto) {
  const response = await axios.post<CreateWorkspaceResponseDto>("/api/workspace/create", request, createRequestConfig());
  return response.data;
}

export async function editWorkspace(request: EditWorkspaceRequestDto) {
  await axios.put("/api/workspace/edit", request, createRequestConfig());
}
