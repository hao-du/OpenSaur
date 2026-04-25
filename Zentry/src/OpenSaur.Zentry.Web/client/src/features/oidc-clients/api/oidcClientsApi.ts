import { deleteRequest, get, post, put } from "../../../infrastructure/http/client";
import type { CreateOidcClientRequestDto } from "../dtos/CreateOidcClientRequestDto";
import type { CreateOidcClientResponseDto } from "../dtos/CreateOidcClientResponseDto";
import type { DeleteOidcClientRequestDto } from "../dtos/DeleteOidcClientRequestDto";
import type { EditOidcClientRequestDto } from "../dtos/EditOidcClientRequestDto";
import type { OidcClientDetailsDto } from "../dtos/OidcClientDetailsDto";
import type { OidcClientSummaryDto } from "../dtos/OidcClientSummaryDto";

export async function getOidcClients() {
  return get<OidcClientSummaryDto[]>("/api/oidc-client/get");
}

export async function getOidcClientById(oidcClientId: string) {
  return get<OidcClientDetailsDto>(`/api/oidc-client/getbyid/${oidcClientId}`);
}

export async function createOidcClient(request: CreateOidcClientRequestDto) {
  return post<CreateOidcClientResponseDto, CreateOidcClientRequestDto>("/api/oidc-client/create", request);
}

export async function editOidcClient(request: EditOidcClientRequestDto) {
  await put("/api/oidc-client/edit", request);
}

export async function deleteOidcClient(request: DeleteOidcClientRequestDto) {
  await deleteRequest(`/api/oidc-client/delete/${request.id}`);
}
