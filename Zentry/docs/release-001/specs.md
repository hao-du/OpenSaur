# Release 001 - Backend-for-Frontend (BFF) Authentication Migration

## 1. Overview & Objective
Migrate the existing client-side OIDC/OAuth2 authentication flow entirely to a secure **Backend-For-Frontend (BFF)** pattern. 

In the current implementation, the React single-page application manages OAuth2 tokens in memory/JavaScript, invokes the authorization code exchange via frontend endpoints, and manages in-memory token refresh loops.

The goal of this release is to eliminate JavaScript access to access and refresh tokens, safeguarding against token theft via XSS, and delegating all credential management, token storage, and session lifecycles to the ASP.NET Core backend using secure, HTTP-only, `SameSite=Strict` cookies.

---

## 2. Architecture & Security Specifications

### 2.1 Backend (ASP.NET Core BFF)
1. **Cookie-Based Authentication**:
   - Primary authentication scheme: `CookieAuthenticationDefaults.AuthenticationScheme` (named `ZentryBffCookie`).
   - Cookie flags: `Name = "__Host-zentry-bff"`, `HttpOnly = true`, `SecurePolicy = Always`, `SameSite = SameSiteMode.Strict`, `Path = "/"`, `SlidingExpiration = true`, `ExpireTimeSpan = 7 days`.
   - Event handling in `BffTokenRefreshCookieEvents`:
     - Returns HTTP 401 Unauthorized for unauthenticated `/api/*` requests (instead of 302 HTML redirect).
     - Returns HTTP 403 Forbidden for unauthorized `/api/*` requests.
2. **OIDC Handshake & Token Management**:
   - Backend initiates OIDC authorization challenge to CoreGate authority via `/bff/login`.
   - Passes `impersonated_user_id` and `workspace_id` parameters to CoreGate when context-switching / impersonating.
   - For already-authenticated users without impersonation parameters, `/bff/login` skips challenge and redirects directly to target return URL.
   - Backend handles the authorization code callback at `/auth/callback` via `Microsoft.AspNetCore.Authentication.OpenIdConnect` securely with PKCE.
   - Saves tokens (`access_token`, `refresh_token`, `id_token`) server-side inside the encrypted authentication ticket.
   - Silent token refresh: `BffTokenRefreshCookieEvents` monitors ticket expiration and silently refreshes expiring tokens with CoreGate via backchannel HTTP client (`CoreGateTokenClient`).
3. **Session & Profile Endpoints**:
   - Single source of truth: `/api/profile/current` (`CurrentProfileResponse`).
   - Returns user identity, roles, navigation items, workspace, and impersonation status to the SPA without exposing raw tokens.
4. **Logout & OIDC End-Session**:
   - Dedicated logout endpoint `/bff/logout` (`LogoutHandler.cs`, `LogoutRequest.cs`).
   - Signs out of local `__Host-zentry-bff` cookie and coordinates remote OIDC end-session redirection to CoreGate (`/connect/endsession`).
5. **CSRF Protection via `SameSiteMode.Strict`**:
   - Because `__Host-zentry-bff` is configured with `SameSite = SameSiteMode.Strict`, the browser strictly withholds the cookie on all cross-site requests, natively eliminating CSRF vulnerabilities without requiring extra antiforgery middleware or token headers.

### 2.2 Frontend (React SPA)
1. **Remove In-Memory Tokens**:
   - Eliminate `accessToken` and `idToken` storage in JavaScript state or browser memory.
   - Remove frontend-driven token refresh timers and client-side token decoding.
2. **Credential Transmission**:
   - Configure Axios client with `withCredentials: true` so the session cookie is automatically transmitted on all `/api/*` and `/bff/*` requests.
3. **Session Initialization & Routing**:
   - Simplify `AuthContext` to fetch session state from `/api/profile/current`.
   - Update `App.tsx` and routing guards to redirect unauthenticated sessions directly to `/bff/login`.
   - Remove obsolete client-side PKCE utilities and `/auth/callback` client route once callback is handled entirely on the backend.

---

## 3. Delivery Scope & Tasks
The work for Release 001 is broken down into distinct feature tasks:
1. `docs/release-001/tasks/feature-001-bff-auth-backend.md`: Backend BFF infrastructure, cookie authentication, OIDC lifecycle endpoints, token management, and SameSite=Strict security.
2. `docs/release-001/tasks/feature-002-spa-auth-cleanup.md`: Frontend client refactoring, cookie-based session hook, and removal of client-side token handling.
3. `docs/release-001/tasks/feature-003-distributed-token-cache.md`: Hybrid cache and multi-node concurrency locking using HybridCache and ILockService.
4. `docs/release-001/tasks/feature-004-retire-runtime-app-config.md`: Retirement of `/app-config.js`, `window.__ZENTRY_CONFIG__`, and `getConfig()` in favor of backend BFF encapsulation.
5. `docs/release-001/tasks/feature-005-cache-lock-optimizations.md`: Application query caching (`/api/permissions`, `/api/profile/current`, `/api/dashboard/summary`) and mutation concurrency locking (`MaxActiveUsers`, role assignments).
6. `docs/release-001/tasks/feature-006-rename-bff-to-auth.md`: Disguise public "bff" naming across endpoints, cookies, and namespaces (`/auth/*`, `zentry-s`).
7. `docs/release-001/tasks/feature-007-user-session-cookie-store.md`: Server-side user session storage (`ITicketStore` / `UserSessionCookieStore`) backed by `IDistributedCache`.


