const rawBaseUrl = import.meta.env.BASE_URL ?? "/";

function normalizeBasePath(baseUrl: string) {
  const trimmed = baseUrl.trim();
  if (trimmed.length === 0 || trimmed === "/") {
    return "";
  }

  const withoutTrailingSlash = trimmed.endsWith("/")
    ? trimmed.slice(0, -1)
    : trimmed;

  return withoutTrailingSlash.startsWith("/")
    ? withoutTrailingSlash
    : `/${withoutTrailingSlash}`;
}

export const appBasePath = normalizeBasePath(rawBaseUrl);

export function withAppBasePath(path: string) {
  if (!path.startsWith("/")) {
    throw new Error("Application paths must start with '/'.");
  }

  return `${appBasePath}${path}` || "/";
}

