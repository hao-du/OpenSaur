# Zentry Phase 1 SPA Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Zentry slice as a hosted browser SPA that authenticates against CoreGate with authorization code + PKCE, handles callback/logout, and shows a protected dashboard with user info.

**Architecture:** `OpenSaur.Zentry.Web` is an ASP.NET Core host that serves a built Vite React SPA plus a runtime config endpoint. The browser SPA owns PKCE generation, authorization redirect, callback token exchange, token persistence, optional user info lookup, guarded routing, and logout redirect behavior.

**Tech Stack:** ASP.NET Core `net10.0`, React 19, TypeScript, Vite 7, React Router 7

---

### Task 1: Scaffold the Hosted SPA Project

**Files:**
- Create: `Zentry/src/OpenSaur.Zentry.slnx`
- Create: `Zentry/src/OpenSaur.Zentry.Web/OpenSaur.Zentry.Web.csproj`
- Create: `Zentry/src/OpenSaur.Zentry.Web/Program.cs`
- Create: `Zentry/src/OpenSaur.Zentry.Web/appsettings.json`
- Create: `Zentry/src/OpenSaur.Zentry.Web/appsettings.Development.json`
- Create: `Zentry/src/OpenSaur.Zentry.Web/Properties/launchSettings.json`
- Create: `Zentry/src/OpenSaur.Zentry.Web/wwwroot/index.html`
- [ ] Scaffold the host project, wire static file hosting, and add the minimal HTML shell.
- [ ] Run `dotnet build Zentry/src/OpenSaur.Zentry.slnx` to verify the host compiles cleanly.

### Task 2: Add Runtime OIDC Configuration and Shell Endpoints

**Files:**
- Create: `Zentry/src/OpenSaur.Zentry.Web/Infrastructure/Configuration/ZentryOidcOptions.cs`
- Create: `Zentry/src/OpenSaur.Zentry.Web/Infrastructure/Configuration/ZentryOidcOptionsExtensions.cs`
- Create: `Zentry/src/OpenSaur.Zentry.Web/Infrastructure/Hosting/FrontendAppRoutes.cs`
- Modify: `Zentry/src/OpenSaur.Zentry.Web/Program.cs`
- Modify: `Zentry/src/OpenSaur.Zentry.Web/appsettings.json`
- Modify: `Zentry/src/OpenSaur.Zentry.Web/appsettings.Development.json`

- [ ] Implement strongly typed OIDC options plus runtime-config and shell-route hosting following the existing Identity pattern, but with Zentry-specific config fields.
- [ ] Re-run `dotnet build Zentry/src/OpenSaur.Zentry.slnx` after the host updates.

### Task 3: Build the SPA Shell and PKCE Auth Modules

**Files:**
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/package.json`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/tsconfig.json`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/tsconfig.app.json`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/tsconfig.node.json`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/vite.config.ts`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/index.html`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/main.tsx`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/App.tsx`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/app/router.tsx`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/config/env.ts`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/config/appBasePath.ts`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/auth/pkce.ts`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/auth/authStorage.ts`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/auth/oidcClient.ts`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/auth/authService.ts`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/auth/authTypes.ts`
- [ ] Implement the minimal runtime config reader, PKCE helpers, state storage, token storage, and OIDC request builders needed for login/callback/logout.
- [ ] Run `npm run build` from `Zentry/src/OpenSaur.Zentry.Web/client` to verify the client type-checks and bundles into `wwwroot`.

### Task 4: Implement Protected Routes, Callback Exchange, Dashboard, and Logout

**Files:**
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/auth/AuthProvider.tsx`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/auth/useAuth.ts`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/pages/HomePage.tsx`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/pages/AuthCallbackPage.tsx`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/pages/DashboardPage.tsx`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/components/AuthErrorPanel.tsx`
- Create: `Zentry/src/OpenSaur.Zentry.Web/client/src/api/userInfo.ts`
- Modify: `Zentry/src/OpenSaur.Zentry.Web/client/src/App.tsx`

- [ ] Implement the minimal provider, routes, callback exchange logic, protected dashboard render, optional user info lookup, retry-on-error panel, and logout.
- [ ] Build the SPA with `npm run build` so `wwwroot` receives the production shell/assets.
- [ ] Run `dotnet build Zentry/src/OpenSaur.Zentry.slnx` again to verify the host still compiles with the bundled SPA assets.

### Task 5: Verify End-to-End Host Build and Document Configuration

**Files:**
- Modify: `Zentry/src/OpenSaur.Zentry.Web/README` if needed via docs file under `Zentry/docs/...` instead of a root README
- Modify: `Zentry/src/OpenSaur.Zentry.Web/appsettings*.json`
- Modify: `Zentry/docs/superpowers/specs/2026-04-17-zentry-phase1-spa-auth-design.md` only if implementation reveals a required clarification

- [ ] Run `npm run build` from `Zentry/src/OpenSaur.Zentry.Web/client`.
- [ ] Run `dotnet build Zentry/src/OpenSaur.Zentry.slnx`.
- [ ] If the implementation introduced any non-obvious configuration assumptions, document them in the existing spec or a short companion note in `Zentry/docs/superpowers/`.
