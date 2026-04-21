import axios from "axios";
import { getAuthSession } from "../../auth/storages/authStorage";
import type { CreateOidcClientRequestDto } from "../dtos/CreateOidcClientRequestDto";
import type { CreateOidcClientResponseDto } from "../dtos/CreateOidcClientResponseDto";
import type { DeleteOidcClientRequestDto } from "../dtos/DeleteOidcClientRequestDto";
import type { EditOidcClientRequestDto } from "../dtos/EditOidcClientRequestDto";
import type { OidcClientDetailsDto } from "../dtos/OidcClientDetailsDto";
import type { OidcClientSummaryDto } from "../dtos/OidcClientSummaryDto";

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

export async function getOidcClients() {
  const response = await axios.get<OidcClientSummaryDto[]>("/api/oidc-client/get", createRequestConfig());
  return response.data;
}

export async function getOidcClientById(oidcClientId: string) {
  const response = await axios.get<OidcClientDetailsDto>(`/api/oidc-client/getbyid/${oidcClientId}`, createRequestConfig());
  return response.data;
}

export async function createOidcClient(request: CreateOidcClientRequestDto) {
  const response = await axios.post<CreateOidcClientResponseDto>("/api/oidc-client/create", request, createRequestConfig());
  return response.data;
}

export async function editOidcClient(request: EditOidcClientRequestDto) {
  await axios.put("/api/oidc-client/edit", request, createRequestConfig());
}

export async function deleteOidcClient(request: DeleteOidcClientRequestDto) {
  await axios.delete(`/api/oidc-client/delete/${request.id}`, createRequestConfig());
}
