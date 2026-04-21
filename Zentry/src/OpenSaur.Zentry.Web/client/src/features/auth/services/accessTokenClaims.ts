import { getAuthSession } from "../storages/authStorage";

type AccessTokenPayload = {
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string | string[];
  role?: string | string[];
  roles?: string | string[];
};

function decodeBase64Url(input: string) {
  const normalizedInput = input.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalizedInput.length % 4)) % 4;
  const paddedInput = normalizedInput.padEnd(normalizedInput.length + paddingLength, "=");
  const binaryValue = window.atob(paddedInput);
  const bytes = Uint8Array.from(binaryValue, character => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

function getTokenPayload(token: string | null | undefined): AccessTokenPayload | null {
  if (token == null) {
    return null;
  }

  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(segments[1])) as AccessTokenPayload;
  } catch {
    return null;
  }
}

function getClaimValues(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value;
  }

  return typeof value === "string" && value.length > 0 ? [value] : [];
}

export function getAccessTokenRoles() {
  const authSession = getAuthSession();
  const payloads = [
    getTokenPayload(authSession?.accessToken),
    getTokenPayload(authSession?.idToken)
  ];

  return payloads
    .flatMap(payload => {
      if (payload == null) {
        return [];
      }

      return [
        ...getClaimValues(payload.roles),
        ...getClaimValues(payload.role),
        ...getClaimValues(payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"])
      ];
    })
    .filter(role => role.length > 0);
}

export function isSuperAdministrator() {
  return getAccessTokenRoles().some(role => role.toUpperCase() === "SUPERADMINISTRATOR");
}
