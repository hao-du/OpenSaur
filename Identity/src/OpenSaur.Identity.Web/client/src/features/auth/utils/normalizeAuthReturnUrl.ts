const defaultReturnUrl = "/";
const disallowedPathnames = new Set([
  "/auth-required",
  "/login",
  "/change-password"
]);

export function normalizeAuthReturnUrl(returnUrl: string | null | undefined) {
  if (!returnUrl || !returnUrl.startsWith("/")) {
    return defaultReturnUrl;
  }

  try {
    // Parse against a dummy origin so we can safely normalize relative app routes while preserving
    // query string and hash fragments.
    const normalizedUrl = new URL(returnUrl, "http://localhost");
    const resolvedReturnUrl = `${normalizedUrl.pathname}${normalizedUrl.search}${normalizedUrl.hash}`;

    // Never send the user back to auth infrastructure routes after login.
    return disallowedPathnames.has(normalizedUrl.pathname)
      ? defaultReturnUrl
      : resolvedReturnUrl;
  } catch {
    return defaultReturnUrl;
  }
}
