# Zentry Hybrid SPA Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first working hybrid SPA auth slice where `Zentry` gets an access token for browser use while `CoreGate` owns refresh capability through an `HttpOnly` cookie flow.

**Architecture:** `CoreGate` remains the OpenID Connect provider and adds SPA-facing exchange and refresh endpoints that wrap token issuance and cookie rotation. `Zentry` remains a browser SPA, stores only access-token-side auth state in JavaScript, and calls the new CoreGate endpoints with credentials enabled.

**Tech Stack:** ASP.NET Core 10, OpenIddict, ASP.NET Core Identity, React 19, TypeScript, Axios

---

### Task 1: CoreGate SPA Token Contract

**Files:**
- Create: `D:\OpenSaur\CoreGate\src\OpenSaur.CoreGate.Web\Features\Auth\Dtos\SpaTokenRequest.cs`
- Create: `D:\OpenSaur\CoreGate\src\OpenSaur.CoreGate.Web\Features\Auth\Dtos\SpaTokenResponse.cs`
- Create: `D:\OpenSaur\CoreGate\src\OpenSaur.CoreGate.Web\Features\Auth\Handlers\Auth\SpaTokenCookieService.cs`
- Create: `D:\OpenSaur\CoreGate\src\OpenSaur.CoreGate.Web\Features\Auth\Handlers\Auth\SpaTokenProxyHandler.cs`
- Modify: `D:\OpenSaur\CoreGate\src\OpenSaur.CoreGate.Web\Features\Auth\AuthEndpoints.cs`
- Modify: `D:\OpenSaur\CoreGate\src\OpenSaur.CoreGate.Web\Features\Auth\DependencyInjection\AuthFeatureServiceCollectionExtensions.cs`
- Modify: `D:\OpenSaur\CoreGate\src\OpenSaur.CoreGate.Web\Program.cs`

- [ ] Add request/response DTOs for SPA code exchange and SPA refresh.
- [ ] Add a cookie helper service that writes, rotates, reads, and clears the refresh-cookie value using `HttpOnly`, `Secure`, and `SameSite=None`.
- [ ] Add a handler that proxies auth-code exchange and refresh requests through CoreGate’s own token endpoint, strips `refresh_token` from the browser-visible response, and stores refresh capability in the cookie.
- [ ] Expose `POST /auth/spa/exchange` and `POST /auth/spa/refresh` endpoints plus an endpoint or logout hook that clears the SPA refresh cookie.
- [ ] Update CORS to allow credentials for configured `Zentry` origins.

### Task 2: CoreGate Logout Integration

**Files:**
- Modify: `D:\OpenSaur\CoreGate\src\OpenSaur.CoreGate.Web\Features\Auth\Handlers\OpenIddict\EndSessionHandler.cs`
- Modify: `D:\OpenSaur\CoreGate\src\OpenSaur.CoreGate.Web\Features\Auth\Handlers\Auth\SpaTokenCookieService.cs`

- [ ] Clear the SPA refresh cookie during end-session so provider logout also removes refresh capability.
- [ ] Keep existing redirect behavior intact after logout.

### Task 3: Zentry Client Exchange and Refresh Flow

**Files:**
- Modify: `d:\OpenSaur\Zentry\src\OpenSaur.Zentry.Web\client\src\auth\authTypes.ts`
- Modify: `d:\OpenSaur\Zentry\src\OpenSaur.Zentry.Web\client\src\auth\authService.ts`
- Modify: `d:\OpenSaur\Zentry\src\OpenSaur.Zentry.Web\client\src\auth\authStorage.ts`
- Modify: `d:\OpenSaur\Zentry\src\OpenSaur.Zentry.Web\client\src\auth\oidcClient.ts`
- Modify: `d:\OpenSaur\Zentry\src\OpenSaur.Zentry.Web\client\src\api\oidcApi.ts`
- Modify: `d:\OpenSaur\Zentry\src\OpenSaur.Zentry.Web\client\src\api\httpClient.ts`

- [ ] Replace direct browser calls to `/connect/token` with calls to the new CoreGate SPA exchange and refresh endpoints.
- [ ] Enable `withCredentials` on those calls so the browser receives and sends the refresh cookie automatically.
- [ ] Keep only access-token-side state in JavaScript.
- [ ] Add refresh logic that renews the access token shortly before expiry and clears auth state on unrecoverable refresh failure.

### Task 4: Zentry UI Wiring

**Files:**
- Modify: `d:\OpenSaur\Zentry\src\OpenSaur.Zentry.Web\client\src\auth\AuthProvider.tsx`
- Modify: `d:\OpenSaur\Zentry\src\OpenSaur.Zentry.Web\client\src\pages\AuthCallbackPage.tsx`
- Modify: `d:\OpenSaur\Zentry\src\OpenSaur.Zentry.Web\client\src\pages\HomePage.tsx`
- Modify: `d:\OpenSaur\Zentry\src\OpenSaur.Zentry.Web\client\src\pages\DashboardPage.tsx`

- [ ] Start refresh scheduling only after successful login.
- [ ] Stop refresh scheduling on logout and auth failure.
- [ ] Keep the dashboard minimal and avoid surfacing refresh-token details in the UI.

### Task 5: Configuration and Verification

**Files:**
- Modify: `D:\OpenSaur\CoreGate\src\OpenSaur.CoreGate.Web\appsettings.json`
- Modify: `D:\OpenSaur\CoreGate\src\OpenSaur.CoreGate.Web\appsettings.Development.json`
- Modify: `d:\OpenSaur\Zentry\src\OpenSaur.Zentry.Web\appsettings.json`
- Modify: `d:\OpenSaur\Zentry\src\OpenSaur.Zentry.Web\appsettings.Development.json`

- [ ] Ensure the configured origins and authority values support credentialed cross-origin auth calls.
- [ ] Build `CoreGate`.
- [ ] Build `OpenSaur.Zentry.Web`.
- [ ] Build the `Zentry` frontend if local Node dependencies are present; otherwise document the verification gap.
