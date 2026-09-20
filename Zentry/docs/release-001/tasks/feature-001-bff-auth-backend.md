# Feature 001: Backend-for-Frontend (BFF) Authentication Backend

## Description
Establish the ASP.NET Core BFF authentication layer using encrypted, HTTP-only SameSite cookies, server-side OIDC challenge/callback flow, token storage/refresh mechanisms, and Antiforgery protection.

---

## Tasks

### Item 1: Cookie & OIDC Authentication Schemes Setup
- [x] Configure `CookieAuthenticationDefaults.AuthenticationScheme` alongside OpenIdConnect/OpenIddict validation in `Program.cs`.
- [x] Ensure cookie security parameters: `HttpOnly = true`, `Secure = Always`, `SameSite = Strict`, session expiration settings.

### Item 2: BFF Login, Callback, & Session Endpoints
- [x] Create `/bff/login` endpoint initiating an `AuthenticationProperties` challenge to the external OIDC authority with return URL and impersonation parameter support, with shortcut for already-authenticated users.
- [x] Configure OIDC callback handling to exchange authorization code for tokens securely on the server.
- [x] Integrate session verification with `/api/profile/current` (returns full profile/claims when authenticated, 401 Unauthorized when unauthenticated).

### Item 3: Server-Side Token Management & Refresh
- [x] Implement server-side storage and silent token refresh using refresh token when access token expires (`BffTokenRefreshCookieEvents`).
- [x] Ensure API authorization policies continue validating authenticated user claims from the cookie session.

### Item 4: BFF Logout Endpoint
- [x] Create `/bff/logout` endpoint that signs out of local cookie authentication scheme (`LogoutHandler.cs`, `LogoutRequest.cs`).
- [x] Trigger remote OpenID Connect sign-out/end-session redirection to CoreGate (`/connect/endsession`).

### Item 5: CSRF Protection via SameSite=Strict
- [x] Enforce `SameSiteMode.Strict` on `__Host-zentry-bff` cookie, natively preventing cross-site request forgery without requiring custom antiforgery middleware or token headers.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[x]` will only be marked upon manual review and approval.

