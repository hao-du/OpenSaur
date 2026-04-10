## Context

The Umbraco app already listens on both `http://localhost:5320` and `https://localhost:5321`, but the middleware pipeline currently applies `UseHttpsRedirection()`. That makes the HTTP endpoint unusable for direct local access even though the development profile exposes it.

## Decisions

### 1. Remove forced HTTPS redirection from the Umbraco pipeline

Delete `app.UseHttpsRedirection()` from `Program.cs` so the app accepts whichever local scheme the browser uses.

### 2. Keep the existing `/cms` path-base behavior unchanged

The `/cms` mounting and root-to-base-path redirect shim stay in place. Only the scheme redirect behavior changes.

## Risks / Trade-offs

- Local HTTP access is less secure than HTTPS, but this change is explicitly for development convenience.
- OIDC callback URIs must still match the actual scheme used during login. If the issuer registration only allows HTTPS callbacks, HTTP-initiated login flows will still be rejected by the issuer.

## Verification

- Build the Umbraco project.
- Verify `http://localhost:5320/cms/umbraco` responds without redirecting to HTTPS.
- Verify `https://localhost:5321/cms/umbraco` still responds.
