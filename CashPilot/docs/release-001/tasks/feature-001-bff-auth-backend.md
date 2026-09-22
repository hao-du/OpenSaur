# Feature 001: Backend-for-Frontend (BFF) Authentication Backend

## Description
Implement the ASP.NET Core BFF authentication layer patterned after Zentry, featuring encrypted HTTP-only `SameSite=Strict` cookies, server-side OIDC challenge/callback flow, token storage, silent background token refresh, and login/logout endpoints.

---

## Tasks

### Item 1: Cookie & OIDC Schemes Configuration
- [x] Add `Microsoft.AspNetCore.Authentication.OpenIdConnect` package to `OpenSaur.CashPilot.Web.csproj`.
- [x] Configure `CookieAuthenticationDefaults.AuthenticationScheme` (`CashPilotBffCookie`) with `__Host-cashpilot-bff`, `HttpOnly = true`, `SecurePolicy = Always`, `SameSite = Strict`, and 7-day expiration.
- [x] Configure `OpenIdConnect` scheme (`CashPilotOidc`) with PKCE, `SaveTokens = true`, and authorization code exchange callback handling.

### Item 2: Token Client & Silent Token Refresh
- [x] Create `ITokenService` and implementation (`OidcTokenService` / `TokenClient`) with resilient backchannel HTTP client for token refreshes.
- [x] Implement `BffTokenRefreshCookieEvents` to silently refresh access tokens via refresh token, and return 401/403 for `/api/*` requests rather than redirecting.

### Item 3: BFF Endpoints (Login & Logout)
- [x] Create `/bff/login` endpoint supporting `returnUrl` (and checking if already authenticated).
- [x] Create `/bff/logout` endpoint that revokes/clears the local cookie session and redirects to remote OIDC end-session (`/connect/endsession`).

### Item 4: Frontend Routing & API Authorization Adaptation
- [x] Update `FrontendEndpoints.cs` and `Program.cs` to route authentication through BFF endpoints and ensure API authorization policies work with cookie session claims.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.

