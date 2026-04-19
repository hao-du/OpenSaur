const pkceStorageKey = "zentry.pkce";

type PkceSession = {
  codeVerifier: string;
  state: string;
};

function encodeBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join("");

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}

function randomString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));

  return encodeBase64Url(bytes);
}

async function sha256(value: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return new Uint8Array(digest);
}

export async function createPkceSession(): Promise<{
  codeChallenge: string;
  codeVerifier: string;
  state: string;
}> {
  const codeVerifier = randomString(48);
  const state = randomString(24);
  const codeChallenge = encodeBase64Url(await sha256(codeVerifier));

  sessionStorage.setItem(
    pkceStorageKey,
    JSON.stringify({
      codeVerifier,
      state
    } satisfies PkceSession)
  );

  return {
    codeChallenge,
    codeVerifier,
    state
  };
}

export function getPkceSession(): PkceSession | null {
  const rawValue = sessionStorage.getItem(pkceStorageKey);
  if (rawValue == null) {
    return null;
  }

  return JSON.parse(rawValue) as PkceSession;
}
