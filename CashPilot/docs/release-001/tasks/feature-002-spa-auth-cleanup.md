# Feature 002: SPA Authentication Cleanup & BFF Integration

## Description
Refactor the CashPilot React single-page application to interact strictly with the BFF backend via secure HTTP-only cookies, removing client-side OAuth2 tokens, public client PKCE flows, and client-side refresh loops.

---

## Tasks

### Item 1: HTTP Client Credentials Configuration
- [x] Configure Axios instance with `withCredentials: true` so the session cookie is transmitted automatically on `/api/*` and `/bff/*` requests.
- [x] Remove obsolete Bearer authorization header interceptors and client-side access token setter.

### Item 2: Auth Context Refactoring
- [x] Refactor `AuthContext.tsx` to remove `accessToken`, `idToken`, and client-side token refresh timer.
- [x] Implement session state (`isAuthenticated`, `isLoading`) backed directly by `/api/profile/current`.

### Item 3: Login & Logout Flow Updates
- [x] Update login redirect to navigate directly to `/bff/login?returnUrl=...`.
- [x] Update logout action to navigate to `/bff/logout?returnUrl=...`.
- [x] Remove obsolete client-side PKCE helper utilities (`UriService.ts`, client-side code verifier/challenge generation).

### Item 4: Routing & Guard Cleanup
- [x] Update route protection in `App.tsx` and `PrepareSessionPage.tsx` to use the cookie session check.
- [x] Remove client `/auth/callback` route now that the callback is handled server-side by OIDC middleware.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.

