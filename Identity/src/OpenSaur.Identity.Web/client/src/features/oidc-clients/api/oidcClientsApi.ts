import { httpClient, type OpenSaurRequestConfig } from "../../../shared/api/httpClient";
import type {
  CreateOidcClientRequest,
  CreateOidcClientResponse,
  DeleteOidcClientRequest,
  EditOidcClientRequest,
  OidcClientDetails,
  OidcClientSummary
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

export async function getOidcClients() {
  return await unwrapData<OidcClientSummary[]>(httpClient.get("/api/oidc-client/get"));
}

export async function getOidcClientById(oidcClientId: string) {
  return await unwrapData<OidcClientDetails>(httpClient.get(`/api/oidc-client/getbyid/${oidcClientId}`));
}

export async function createOidcClient(request: CreateOidcClientRequest) {
  return await unwrapData<CreateOidcClientResponse>(httpClient.post("/api/oidc-client/create", request, {
    idempotent: true
  } as OpenSaurRequestConfig));
}

export async function editOidcClient(request: EditOidcClientRequest) {
  await httpClient.put("/api/oidc-client/edit", request, {
    idempotent: true
  } as OpenSaurRequestConfig);
}

export async function deleteOidcClient(request: DeleteOidcClientRequest) {
  await httpClient.delete(`/api/oidc-client/delete/${request.id}`);
}
