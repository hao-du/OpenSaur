import { client } from "../../../infrastructure/http/client";
import type { CreateRoleRequestDto } from "../dtos/CreateRoleRequestDto";
import type { CreateRoleResponseDto } from "../dtos/CreateRoleResponseDto";
import type { EditRoleRequestDto } from "../dtos/EditRoleRequestDto";
import type { PermissionSummaryDto } from "../dtos/PermissionSummaryDto";
import type { RoleDetailsDto } from "../dtos/RoleDetailsDto";
import type { RoleSummaryDto } from "../dtos/RoleSummaryDto";

export async function getRoles() {
  return client.get<RoleSummaryDto[]>("/api/role/get");
}

export async function getRoleById(roleId: string) {
  return client.get<RoleDetailsDto>(`/api/role/getbyid/${roleId}`);
}

export async function getPermissions() {
  return client.get<PermissionSummaryDto[]>("/api/permission/get");
}

export async function createRole(request: CreateRoleRequestDto) {
  return client.post<CreateRoleResponseDto, CreateRoleRequestDto>("/api/role/create", request);
}

export async function editRole(request: EditRoleRequestDto) {
  await client.put("/api/role/edit", request);
}
