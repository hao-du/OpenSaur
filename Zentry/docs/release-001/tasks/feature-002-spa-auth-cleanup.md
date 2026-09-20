# Feature 002: SPA Authentication Cleanup & BFF Integration

## Description
Refactor the React 19 single-page application to interact strictly with the BFF backend via secure HTTP-only cookies, eliminating in-memory token storage, public client PKCE flows, and client-side refresh loops.

---

## Tasks

### Item 1: HTTP Client Credentials Configuration
- [x] Configure Axios instance to include credentials (`withCredentials: true`) for all requests.
- [x] Remove obsolete bearer authorization header interceptors from Axios client.

### Item 2: Auth Context Refactoring
- [x] Refactor `AuthContext.tsx` to remove `accessToken`, `idToken`, and `AuthSessionDto` storage.
- [x] Manage simple session state (`isAuthenticated`, `isLoading`) backed by `/api/profile/current`.
- [x] Remove in-memory token refresh timers and client-side token decoding.

### Item 3: Login & Logout Flow Updates
- [x] Update login action to perform navigation to `/bff/login?returnUrl=...`.
- [x] Update logout action to navigate to `/bff/logout?returnUrl=...`.
- [x] Update workspace impersonation dialog to navigate to `/bff/login?impersonatedUserId=...&workspaceId=...`.
- [x] Retire obsolete client-side PKCE helper utilities (`UriService.ts`, client-side code verifier/challenge generation).

### Item 4: Routing & Guard Cleanup
- [ ] Update route protection in `App.tsx` and `PrepareSessionPage.tsx` to handle cookie session checks.
- [ ] Deprecate or remove `/auth/callback` client route once callback is handled entirely on the backend.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[x]` will only be marked upon manual review and approval.
