## Why

The Phase 1 backend is complete, but there is still no first-party web experience for login, callback handling, password rotation, or authenticated shell behavior. We need a small frontend phase now so the same-host identity service can be exercised by a real browser client before broader admin UI work begins.

## What Changes

- Add a React frontend under `src/OpenSaur.Identity.Web/client` using Vite for development and ASP.NET Core static hosting for same-host deployment.
- Implement an auth-only first frontend phase with `/login`, `/auth/callback`, `/change-password`, and one protected shell route.
- Use a feature-first frontend structure with atomic design layers, Lucide icons, and responsive layouts for mobile, tablet, and desktop.
- Add TanStack Query, React Hook Form, axios, and shared frontend auth infrastructure for route guards, API calls, and session bootstrap.
- Implement first-party OpenIddict authorization-code handling in the frontend so successful login returns a JWT access token to the FE, redirects back to the previous route, and supports pre-expiry token refresh.
- Keep the refresh token in a backend-managed `httpOnly` cookie, keep the access token in FE memory only, and redirect back to login when refresh or token validation fails.
- Add the host integration needed for Vite development and ASP.NET Core serving of the built client assets in same-host deployment.
- Add frontend verification for login, callback, forced password change, redirect-back behavior, refresh orchestration, and expired-token fallback.
- Defer browser automation to a separate automation test project instead of embedding it in the client app or this change.

## Capabilities

### New Capabilities
- `identity-fe-auth-shell`: First-party React auth shell, protected routing, token lifecycle handling, and same-host frontend delivery for the identity service.

### Modified Capabilities
- `identity-authentication`: Extend the authentication contract to cover first-party frontend callback completion, proactive access-token refresh, and redirect-back behavior for expired or invalid sessions.

## Impact

- Affected code: `src/OpenSaur.Identity.Web/client/**`, ASP.NET Core host integration under `src/OpenSaur.Identity.Web/**`, and existing repo documentation for the frontend workflow
- New frontend dependencies for React, Vite, TanStack Query, React Hook Form, axios, Lucide, and MUI
- Same-host runtime behavior where `/api/*` remains backend API traffic and non-API routes serve the first-party web app
- Additional first-party auth flow, token refresh, and redirect-back verification coverage
