# Zentry OIDC Client CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port Identity’s full OIDC client CRUD feature into Zentry with super-admin-only access and a management page inside Zentry’s existing shell.

**Architecture:** Recreate the backend OIDC client feature as a Zentry-local feature slice using Zentry’s `ApplicationDbContext` and OpenIddict EF entities, then add a Zentry-native management page that mirrors Identity’s CRUD workflows inside the current shell/navigation structure. Keep authorization narrow and feature-scoped.

**Tech Stack:** ASP.NET Core minimal APIs, EF Core, OpenIddict EF Core, FluentValidation, React, TypeScript, MUI

---

### Task 1: Add backend OIDC client feature slice

**Files:**
- Create: `src/OpenSaur.Zentry.Web/Features/OidcClients/OidcClientEndpoints.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/OidcClients/OpenIddictApplicationMetadata.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/OidcClients/OidcClientRequestNormalization.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/OidcClients/OidcClientResponseModels.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/OidcClients/CreateOidcClient/CreateOidcClientHandler.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/OidcClients/CreateOidcClient/CreateOidcClientRequest.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/OidcClients/CreateOidcClient/CreateOidcClientRequestValidator.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/OidcClients/CreateOidcClient/CreateOidcClientResponse.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/OidcClients/EditOidcClient/EditOidcClientHandler.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/OidcClients/EditOidcClient/EditOidcClientRequest.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/OidcClients/EditOidcClient/EditOidcClientRequestValidator.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/OidcClients/DeleteOidcClient/DeleteOidcClientHandler.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/OidcClients/GetOidcClients/GetOidcClientsHandler.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/OidcClients/GetOidcClientById/GetOidcClientByIdHandler.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/OidcClients/GetOidcClientById/GetOidcClientByIdResponse.cs`
- Modify: `src/OpenSaur.Zentry.Web/OpenSaur.Zentry.Web.csproj`

- [ ] Copy the OIDC client feature logic into Zentry namespaces and paths.
- [ ] Add FluentValidation package references if Zentry does not already have them.
- [ ] Keep behavior aligned with Identity, but replace Identity-only infrastructure dependencies with Zentry-local equivalents.

### Task 2: Add super-admin-only backend access guard

**Files:**
- Create: `src/OpenSaur.Zentry.Web/Infrastructure/Auth/SuperAdminAuthorization.cs`
- Modify: `src/OpenSaur.Zentry.Web/Program.cs`
- Modify: `src/OpenSaur.Zentry.Web/Features/OidcClients/OidcClientEndpoints.cs`

- [ ] Add the smallest Zentry-local authorization helper needed to reject non-super-admin users.
- [ ] Register authentication/authorization services needed by the feature guard.
- [ ] Apply the super-admin guard to the OIDC client endpoint group.

### Task 3: Add frontend OIDC client feature module

**Files:**
- Create: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/api/oidcClientsApi.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/api/index.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/types.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/hooks/index.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/hooks/useOidcClientsQuery.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/hooks/useOidcClientQuery.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/hooks/useCreateOidcClient.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/hooks/useEditOidcClient.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/hooks/useDeleteOidcClient.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/components/index.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/components/OidcClientForm.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/components/OidcClientFormDrawer.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/components/OidcClientFiltersDrawer.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/components/OidcClientsTable.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/utils/filterOidcClients.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/pages/OidcClientsPage.tsx`

- [ ] Port Identity’s OIDC client frontend feature logic into Zentry’s feature/page structure.
- [ ] Preserve form fields and CRUD behavior while adapting page composition to Zentry’s shell.
- [ ] Reuse Zentry’s existing layout and styling primitives where possible.

### Task 4: Wire shell navigation and routing

**Files:**
- Modify: `src/OpenSaur.Zentry.Web/client/src/App.tsx`
- Modify: `src/OpenSaur.Zentry.Web/client/src/components/organisms/SideMenu.tsx`

- [ ] Add the OIDC clients management route inside the existing shell flow.
- [ ] Add a navigation entry that points to the new page.
- [ ] Keep existing Zentry dashboard/auth routes working.

### Task 5: Verify builds and manual access expectations

**Files:**
- Modify: none

- [ ] Run `dotnet build src/OpenSaur.Zentry.Web/OpenSaur.Zentry.Web.csproj`.
- [ ] Run `npm run build-dev` in `src/OpenSaur.Zentry.Web/client`.
- [ ] Note that manual verification is still required for super-admin-only access and CRUD flows because this repo does not use automated tests for this work.
