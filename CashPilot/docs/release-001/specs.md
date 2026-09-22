# Release 001 - Backend-for-Frontend (BFF) Authentication & Modernization

## 1. Overview & Objective
Modernize CashPilot's architecture by:
1. Migrating from client-side OpenIddict/OIDC authentication to a secure **Backend-for-Frontend (BFF)** pattern (modeled after **Zentry** in `D:\OpenSaur\Zentry`).
2. Eliminating JavaScript access to tokens, delegating session lifecycle and credential management to the ASP.NET Core backend with secure HTTP-only `SameSite=Strict` cookies.
3. Retiring the runtime application config (`/app-config.js`) and explicit frontend route handler in favor of standard SPA fallback.
4. Removing the deprecated **Offline-First & Synchronization** layer (including Service Worker, client-side offline storage, pending transaction submissions, and offline deployment pipeline).

---

## 2. Architectural Specifications

### 2.1 Backend (ASP.NET Core BFF)
1. **Authentication Schemes**:
   - Primary default scheme: Cookie authentication (`CashPilotBffCookie`).
   - Cookie configuration: `Name = "__Host-cashpilot-bff"`, `HttpOnly = true`, `SecurePolicy = Always`, `SameSite = SameSiteMode.Strict`, `Path = "/"`, `SlidingExpiration = true`, `ExpireTimeSpan = 7 days`.
   - OpenID Connect scheme (`CashPilotOidc`):
     - Initiated by challenge from `/bff/login`.
     - Handles authorization code callback at `/auth/callback` on backend with PKCE (`UsePkce = true`, `SaveTokens = true`).
     - Stores tokens (`access_token`, `refresh_token`, `id_token`) securely inside the server session ticket.
2. **Cookie Events & Silent Refresh**:
   - `BffTokenRefreshCookieEvents`:
     - Inspects `/api/*` endpoints: returns HTTP 401 Unauthorized for unauthenticated requests and HTTP 403 Forbidden for unauthorized requests (instead of 302 redirect).
     - Monitors access token expiration and silently refreshes expiring tokens using the refresh token via a dedicated backchannel HTTP client (`CashPilotTokenClient`).
3. **BFF Endpoints**:
   - `/bff/login`: Initiates OIDC challenge; redirects directly to `returnUrl` if already authenticated.
   - `/bff/logout`: Signs out of cookie session and redirects to OIDC authority end-session (`/connect/endsession`).
   - `/api/profile/current`: Returns current user identity, permissions, and navigation items.
4. **Retirement of Runtime App Config & Frontend Route Handler**:
   - Delete `/app-config.js` endpoint, `CreateAppConfigJsHandler.cs`, and `FrontentAppConfigJsDto.cs`.
   - Replace explicit route enumeration in `FrontendEndpoints.cs` and `CreateFrontendRouteHandler.cs` with standard `app.MapFallbackToFile("index.html")`.
5. **Retirement of Pending Transactions**:
   - Remove `Features/PendingTransactions` and database entity `PendingTransactionSubmission`.
6. **CSRF Protection**:
   - `SameSiteMode.Strict` on `__Host-cashpilot-bff` cookie provides native CSRF protection for modern browsers.

### 2.2 Frontend (React SPA)
1. **Client Cleanup**:
   - Remove client-side token handling (`accessToken`, `idToken`, client-side refresh timer).
   - Configure Axios with `withCredentials: true` and remove `Authorization: Bearer` interceptors.
   - Remove `<script src="/app-config.js"></script>` from `index.html`.
   - Remove `Config.ts` and `ConfigDto.ts`.
2. **Session State & Navigation**:
   - Refactor `AuthContext` to query `/api/profile/current` to determine session validity.
   - Unauthenticated sessions navigate to `/bff/login?returnUrl=...`.
   - Logout navigates to `/bff/logout?returnUrl=...`.
   - Remove client-side PKCE code verifier and callback handling.
3. **Removal of Offline Features**:
   - Delete `client/src/features/offline` and `client/src/features/pending`.
   - Remove Service Worker registration and PWA assets.
   - Remove offline build scripts from `package.json` and `vite.config.ts`.

---

## 3. Scope of Tasks

1. `docs/release-001/tasks/feature-001-bff-auth-backend.md`: Backend BFF authentication, cookie scheme, OIDC handlers, token refresh events, and login/logout endpoints.
2. `docs/release-001/tasks/feature-002-spa-auth-cleanup.md`: Frontend client refactoring, cookie credentials, and removal of client-side token logic.
3. `docs/release-001/tasks/feature-003-retire-runtime-app-config.md`: Retirement of `/app-config.js`, `window.__CASHPILOT_CONFIG__`, `getConfig()`, and simplification of frontend routing to `MapFallbackToFile`.
4. `docs/release-001/tasks/feature-004-retire-offline-and-sync.md`: Removal of Offline-First components, Service Worker, and backend PendingTransactions.
5. `docs/release-001/tasks/feature-005-hybrid-cache-optimizations.md`: HybridCache performance optimization for dashboard, reports, profile, and filter variance.
