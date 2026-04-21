# Zentry Backend Forbidden Applications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Applications authorization fully to the backend and show a dedicated SPA `403` page when authenticated users without the required role reach that area.

**Architecture:** Keep the backend OIDC client API protected by the existing `SuperAdminAuthorization` policy and remove the frontend's access-token role parsing. Let the Applications page load normally for authenticated users, detect backend `403` responses through the OIDC client query layer, and redirect to a shared forbidden page route rendered inside the existing shell.

**Tech Stack:** ASP.NET Core minimal APIs, React, TypeScript, React Router, React Query, Axios, MUI

---

### Task 1: Remove client-side role parsing from routing and navigation

**Files:**
- Modify: `src/OpenSaur.Zentry.Web/client/src/App.tsx`
- Modify: `src/OpenSaur.Zentry.Web/client/src/components/organisms/SideMenu.tsx`
- Delete: `src/OpenSaur.Zentry.Web/client/src/features/auth/services/accessTokenClaims.ts` if no longer referenced

- [ ] Remove `hasSuperAdministratorRole(authSession.accessToken)` from the `/applications` route in `App.tsx` so the route is treated like the other authenticated shell routes.
- [ ] Remove the access-token role check from `SideMenu.tsx` and keep the `Applications` navigation item visible for authenticated users.
- [ ] Delete the now-unused `accessTokenClaims.ts` helper if `rg "hasSuperAdministratorRole|accessTokenClaims"` confirms there are no remaining references.
- [ ] Run `rg -n "hasSuperAdministratorRole|accessTokenClaims" src/OpenSaur.Zentry.Web/client/src` and expect no matches after cleanup.

### Task 2: Add a dedicated forbidden page route to the SPA

**Files:**
- Modify: `src/OpenSaur.Zentry.Web/client/src/App.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/pages/ForbiddenPage.tsx`
- Modify: `src/OpenSaur.Zentry.Web/Features/Frontend/FrontendEndpoints.cs`

- [ ] Add a `/forbidden` route in `App.tsx` that renders a new `ForbiddenPage` inside the normal authenticated shell.
- [ ] Create `ForbiddenPage.tsx` using `DefaultLayout` so the page matches the current Zentry chrome and clearly states that the current account does not have permission to access Applications.
- [ ] Add `/forbidden` to `FrontendEndpoints.cs` so direct navigation or refresh on the forbidden page still serves the SPA entrypoint.
- [ ] Keep `/prepare-session` and `/auth/callback` behavior unchanged.

### Task 3: Detect backend `403` responses in the OIDC client feature

**Files:**
- Modify: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/api/oidcClientsApi.ts`
- Modify: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/hooks/useOidcClientsQuery.ts`
- Modify: `src/OpenSaur.Zentry.Web/client/src/pages/OidcClientsPage.tsx`

- [ ] Add a small helper in `oidcClientsApi.ts` that detects whether an Axios error represents HTTP `403 Forbidden`.
- [ ] Expose enough query state from `useOidcClientsQuery.ts` for the page to distinguish a forbidden response from generic API errors.
- [ ] Update `OidcClientsPage.tsx` to redirect to `/forbidden` when the list query fails with `403`, while preserving the existing retry/error handling for non-403 failures.
- [ ] Keep CRUD mutation behavior unchanged for this pass unless the page flow requires a small follow-up guard for a `403` from detail fetches.

### Task 4: Confirm backend remains the authority

**Files:**
- Review only: `src/OpenSaur.Zentry.Web/Features/OidcClients/OidcClientEndpoints.cs`
- Review only: `src/OpenSaur.Zentry.Web/Infrastructure/Auth/SuperAdminAuthorization.cs`

- [ ] Confirm the OIDC client endpoint group still uses `.RequireAuthorization(SuperAdminAuthorization.PolicyName)`.
- [ ] Do not add a new frontend capability endpoint or duplicate the authorization rule in another backend location.
- [ ] If an authenticated non-super-admin request does not already produce `403`, adjust only the minimal backend authorization wiring needed to restore that behavior before changing anything broader.

### Task 5: Run build verification and manual checks

**Files:**
- Modify: none

- [ ] Run `dotnet build src/OpenSaur.Zentry.Web/OpenSaur.Zentry.Web.csproj` and resolve any backend compile issues from the routing change.
- [ ] Run `npm run build-dev` in `src/OpenSaur.Zentry.Web/client` and resolve any frontend compile issues from the new page and route.
- [ ] Manually verify as a super administrator that `/applications` still loads and the existing CRUD UI works.
- [ ] Manually verify as a non-super-administrator that navigating to `/applications` results in the forbidden page after the API returns `403`.
- [ ] Manually verify that requesting `/api/oidc-client/get` as a non-super-administrator returns `403`.
- [ ] Do not add automated tests because this repo explicitly requires manual verification for this kind of work.
