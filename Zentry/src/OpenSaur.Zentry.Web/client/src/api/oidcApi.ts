import { buildTokenEndpointUrl, buildTokenRequestBody } from "../auth/oidcClient";
import type { AppRuntimeConfig, PendingAuthRequest } from "../auth/authTypes";
import { createApiError } from "./apiErrors";
import { httpClient } from "./httpClient";

export async function exchangeAuthorizationCode(
  config: AppRuntimeConfig,
  code: string,
  pendingRequest: PendingAuthRequest
) {
  try {
    const response = await httpClient.post<Record<string, unknown>>(
      buildTokenEndpointUrl(config),
      buildTokenRequestBody(config, code, pendingRequest),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    return response.data;
  } catch (error) {
    throw createApiError(error, "Token exchange failed");
  }
}
