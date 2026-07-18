import { client } from "../../../infrastructure/http/client";
import type { AssignUserRolesRequestDto } from "../dtos/AssignUserRolesRequestDto";
import type { CreateUserRequestDto } from "../dtos/CreateUserRequestDto";
import type { CreateUserResponseDto } from "../dtos/CreateUserResponseDto";
import type { EditUserRequestDto } from "../dtos/EditUserRequestDto";
import type { ResetUserPasswordRequestDto } from "../dtos/ResetUserPasswordRequestDto";
import type { UserDetailsDto } from "../dtos/UserDetailsDto";
import type { UserRolesDto } from "../dtos/UserRolesDto";
import type { UserSummaryDto } from "../dtos/UserSummaryDto";

export async function getUsers() {
  return client.get<UserSummaryDto[]>("/api/user/get");
}

export async function getUserById(userId: string) {
  return client.get<UserDetailsDto>(`/api/user/getbyid/${userId}`);
}

export async function createUser(request: CreateUserRequestDto) {
  return client.post<CreateUserResponseDto, CreateUserRequestDto>("/api/user/create", request);
}

export async function editUser(request: EditUserRequestDto) {
  await client.put("/api/user/edit", request);
}

export async function resetUserPassword(userId: string, request: ResetUserPasswordRequestDto) {
  await client.put<void, ResetUserPasswordRequestDto>(`/api/user/${userId}/reset-password`, request);
}

export async function getUserRoles(userId: string) {
  return client.get<UserRolesDto>(`/api/user/${userId}/roles`);
}

export async function assignUserRoles(userId: string, request: AssignUserRolesRequestDto) {
  await client.put<void, AssignUserRolesRequestDto>(`/api/user/${userId}/roles`, request);
}
