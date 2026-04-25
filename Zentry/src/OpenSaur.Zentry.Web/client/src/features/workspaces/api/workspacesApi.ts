import { get, post, put } from "../../../infrastructure/http/client";
import type { AssignableWorkspaceRoleDto } from "../dtos/AssignableWorkspaceRoleDto";
import type { CreateWorkspaceRequestDto } from "../dtos/CreateWorkspaceRequestDto";
import type { CreateWorkspaceResponseDto } from "../dtos/CreateWorkspaceResponseDto";
import type { EditWorkspaceRequestDto } from "../dtos/EditWorkspaceRequestDto";
import type { WorkspaceDetailsDto } from "../dtos/WorkspaceDetailsDto";
import type { WorkspaceSummaryDto } from "../dtos/WorkspaceSummaryDto";

export async function getWorkspaces() {
  return get<WorkspaceSummaryDto[]>("/api/workspace/get");
}

export async function getWorkspaceById(workspaceId: string) {
  return get<WorkspaceDetailsDto>(`/api/workspace/getbyid/${workspaceId}`);
}

export async function getAssignableWorkspaceRoles() {
  return get<AssignableWorkspaceRoleDto[]>("/api/workspace/roles");
}

export async function createWorkspace(request: CreateWorkspaceRequestDto) {
  return post<CreateWorkspaceResponseDto, CreateWorkspaceRequestDto>("/api/workspace/create", request);
}

export async function editWorkspace(request: EditWorkspaceRequestDto) {
  await put("/api/workspace/edit", request);
}
