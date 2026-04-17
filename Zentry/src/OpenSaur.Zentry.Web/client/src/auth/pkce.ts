import type { PendingAuthRequest } from "./authTypes";

const AllowedCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

function generateCodeVerifier(length = 96) {
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);

  return Array.from(randomBytes, (value) => AllowedCharacters[value % AllowedCharacters.length]).join("");
}

function generateState(length = 48) {
  return generateCodeVerifier(length);
}

async function generateCodeChallenge(codeVerifier: string) {
  const verifierBytes = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", verifierBytes);
  return toBase64Url(new Uint8Array(digest));
}

export async function buildPkceRequest(redirectPath = "/dashboard"): Promise<PendingAuthRequest> {
  const codeVerifier = generateCodeVerifier();

  return {
    codeChallenge: await generateCodeChallenge(codeVerifier),
    codeChallengeMethod: "S256",
    codeVerifier,
    createdAtUtc: new Date().toISOString(),
    redirectPath,
    state: generateState()
  };
}

function toBase64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (value) => String.fromCharCode(value)).join("");
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
