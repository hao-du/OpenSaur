# Users Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder `Users` page with workspace-scoped user management that enforces the `Personal` workspace rule, hides `Users` at `All workspaces`, and supports role assignment editing from the user editor.

**Architecture:** Add one backend capability flag to `/api/auth/me`, one focused backend access rule for workspace-scoped user management, and targeted user-role read endpoints for user-scoped role assignment data. On the frontend, drive shell visibility from the session capability, replace the placeholder page with the existing admin-list pattern, and orchestrate user plus role-assignment saves in one UI flow.

**Tech Stack:** ASP.NET Core minimal APIs, EF Core, ASP.NET Core Identity, React, MUI, TanStack Query, Vitest, xUnit

---

### Task 1: Lock backend access rules with failing tests

**Files:**
- Modify: `src/OpenSaur.Identity.Web.Tests/Features/Auth/ApiAuthAccountEndpointsTests.cs`
- Modify: `src/OpenSaur.Identity.Web.Tests/Features/Users/UserEndpointsTests.cs`
- Modify: `src/OpenSaur.Identity.Web.Tests/Features/UserRoles/UserRoleEndpointsTests.cs`

- [ ] Add failing tests for `/api/auth/me` returning `canManageUsers`
- [ ] Add failing tests for `All workspaces` being rejected from `/api/user/*`
- [ ] Add failing tests for non-superadmin `Personal` access being rejected from `/api/user/*` and user-role reads

### Task 2: Implement backend access and session capability

**Files:**
- Modify: `src/OpenSaur.Identity.Web/Features/Auth/Me/AuthMeResponse.cs`
- Modify: `src/OpenSaur.Identity.Web/Features/Auth/Me/GetCurrentUserHandler.cs`
- Create: `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Builders/UserManagementEndpointConventionBuilderExtensions.cs`
- Create: `src/OpenSaur.Identity.Web/Infrastructure/Authorization/Filters/UserManagementAccessFilter.cs`
- Modify: `src/OpenSaur.Identity.Web/Features/Users/UserEndpoints.cs`
- Modify: `src/OpenSaur.Identity.Web/Features/UserRoles/UserRoleEndpoints.cs`

- [ ] Add the dedicated user-management access rule
- [ ] Compute `canManageUsers` in `/api/auth/me`
- [ ] Apply the new access rule to user-management and user-scoped user-role endpoints

### Task 3: Add user-scoped role-assignment reads

**Files:**
- Modify: `src/OpenSaur.Identity.Web/Infrastructure/Database/Repositories/UserRoles/UserRoleRepository.cs`
- Modify: `src/OpenSaur.Identity.Web/Infrastructure/Database/Repositories/UserRoles/Dtos/*.cs`
- Create: `src/OpenSaur.Identity.Web/Features/UserRoles/GetUserAssignments/*`
- Create: `src/OpenSaur.Identity.Web/Features/UserRoles/GetRoleCandidates/*`
- Modify: `src/OpenSaur.Identity.Web/Features/UserRoles/UserRoleEndpoints.cs`

- [ ] Add repository methods for current assignments and active role candidates
- [ ] Expose focused read endpoints for the user editor
- [ ] Re-run targeted backend tests

### Task 4: Replace the placeholder Users page

**Files:**
- Modify: `src/OpenSaur.Identity.Web/client/src/app/router/protectedShellRoutes.ts`
- Modify: `src/OpenSaur.Identity.Web/client/src/app/router/AppRouter.tsx`
- Modify: `src/OpenSaur.Identity.Web/client/src/features/auth/api/authApi.ts`
- Create: `src/OpenSaur.Identity.Web/client/src/features/users/**`
- Modify: `src/OpenSaur.Identity.Web/client/src/pages/users/UsersPage.tsx`
- Create: `src/OpenSaur.Identity.Web/client/src/pages/users/UsersPage.test.tsx`

- [ ] Add failing router/page tests for Users visibility and rendering
- [ ] Implement list, filter drawer, and table
- [ ] Keep default status `Active` and preserve filters after save

### Task 5: Add the user editor and combined save flow

**Files:**
- Create: `src/OpenSaur.Identity.Web/client/src/features/users/components/**`
- Create: `src/OpenSaur.Identity.Web/client/src/features/users/hooks/**`
- Create: `src/OpenSaur.Identity.Web/client/src/features/users/api/**`
- Modify: `src/OpenSaur.Identity.Web/client/src/pages/users/UsersPage.tsx`

- [ ] Add failing tests for create/edit and role assignment save behavior
- [ ] Implement the user editor drawer
- [ ] Implement the combined save orchestration for user details plus role assignments

### Task 6: Verify and close the slice

**Files:**
- Modify: `openspec/changes/identity-fe-phase-6-users/tasks.md`

- [ ] Run targeted frontend tests
- [ ] Run targeted backend tests
- [ ] Run `npm run build`
- [ ] Run `dotnet build src/OpenSaur.Identity.Web/OpenSaur.Identity.Web.csproj -c Release`
- [ ] Run `openspec validate identity-fe-phase-6-users`
