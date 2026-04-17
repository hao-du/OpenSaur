import { buildUserInfoEndpointUrl } from "../auth/oidcClient";
import type { AppRuntimeConfig, UserProfile } from "../auth/authTypes";

export async function fetchUserInfo(config: AppRuntimeConfig, accessToken: string): Promise<UserProfile> {
  const response = await fetch(buildUserInfoEndpointUrl(config), {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`User info request failed with status ${response.status}.`);
  }

  const payload = await response.json() as Record<string, unknown>;
  return {
    email: readString(payload.email),
    preferredUsername: readString(payload.preferred_username),
    roles: readStringArray(payload.role),
    subject: readString(payload.sub) ?? "unknown",
    workspaceId: readString(payload.workspace_id)
  };
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0
    ? value
    : undefined;
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
