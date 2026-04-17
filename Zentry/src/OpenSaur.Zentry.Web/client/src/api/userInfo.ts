import { buildUserInfoEndpointUrl } from "../auth/oidcClient";
import type { AppRuntimeConfig, UserProfile } from "../auth/authTypes";
import { createApiError } from "./apiErrors";
import { httpClient } from "./httpClient";

type UserInfoResponse = {
  email?: string;
  preferred_username?: string;
  role?: string | string[];
  sub?: string;
  workspace_id?: string;
};

export async function fetchUserInfo(config: AppRuntimeConfig, accessToken: string): Promise<UserProfile> {
  try {
    const response = await httpClient.get<UserInfoResponse>(buildUserInfoEndpointUrl(config), {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const payload = response.data;
    return {
      email: payload.email,
      preferredUsername: payload.preferred_username,
      roles: readStringArray(payload.role),
      subject: payload.sub ?? "unknown",
      workspaceId: payload.workspace_id
    };
  } catch (error) {
    throw createApiError(error, "User info request failed");
  }
}

function readStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }

  if (typeof value === "string" && value.length > 0) {
    return [value];
  }

  return undefined;
}
