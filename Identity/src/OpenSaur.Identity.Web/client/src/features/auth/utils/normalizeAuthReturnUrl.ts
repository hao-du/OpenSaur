const defaultReturnUrl = "/";
const disallowedPathnames = new Set([
  "/login",
  "/auth/callback",
  "/change-password"
]);

export function normalizeAuthReturnUrl(returnUrl: string | null | undefined) {
  if (!returnUrl || !returnUrl.startsWith("/")) {
    return defaultReturnUrl;
  }

  try {
    const normalizedUrl = new URL(returnUrl, "http://localhost");
    const resolvedReturnUrl = `${normalizedUrl.pathname}${normalizedUrl.search}${normalizedUrl.hash}`;

    return disallowedPathnames.has(normalizedUrl.pathname)
      ? defaultReturnUrl
      : resolvedReturnUrl;
  } catch {
    return defaultReturnUrl;
  }
}
