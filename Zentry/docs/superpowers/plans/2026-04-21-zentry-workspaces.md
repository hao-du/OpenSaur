# Zentry Workspaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port Identity workspace management into Zentry with super-admin-only list/create/edit/status management and workspace role assignments in the same drawer workflow.

**Architecture:** Add a Zentry-local `Features/Workspaces` backend slice using existing `Workspace`, `WorkspaceRole`, and `ApplicationRole` entities, then add a `/workspaces` management page in the current shell using Zentry’s existing drawer, dialog, auth, and theme patterns. Exclude impersonation and keep authorization aligned with `SuperAdminOnly`.

**Tech Stack:** ASP.NET Core minimal APIs, EF Core, FluentValidation, React, TypeScript, React Query, MUI

---

### Task 1: Backend Workspace Feature

**Files:**
- Create: `src/OpenSaur.Zentry.Web/Features/Workspaces/WorkspaceEndpoints.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/Workspaces/WorkspaceHelper.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/Workspaces/GetWorkspaces/GetWorkspacesHandler.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/Workspaces/GetWorkspaces/GetWorkspacesResponse.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/Workspaces/GetWorkspaceById/GetWorkspaceByIdHandler.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/Workspaces/GetWorkspaceById/GetWorkspaceByIdResponse.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/Workspaces/CreateWorkspace/CreateWorkspaceHandler.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/Workspaces/CreateWorkspace/CreateWorkspaceRequest.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/Workspaces/CreateWorkspace/CreateWorkspaceRequestValidator.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/Workspaces/CreateWorkspace/CreateWorkspaceResponse.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/Workspaces/EditWorkspace/EditWorkspaceHandler.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/Workspaces/EditWorkspace/EditWorkspaceRequest.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/Workspaces/EditWorkspace/EditWorkspaceRequestValidator.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/Workspaces/GetAssignableRoles/GetAssignableRolesHandler.cs`
- Create: `src/OpenSaur.Zentry.Web/Features/Workspaces/GetAssignableRoles/GetAssignableRolesResponse.cs`
- Modify: `src/OpenSaur.Zentry.Web/Program.cs`

- [ ] Add workspace endpoint mapping and require `SuperAdminOnly` for the entire route group.
- [ ] Port list/detail/create/edit contracts and validators from Identity, adapting them to Zentry’s direct minimal API result style.
- [ ] Implement workspace role assignment persistence by replacing a workspace’s active `WorkspaceRoles` from submitted role ids in create/edit handlers.
- [ ] Add assignable roles query endpoint for the drawer checkbox list.

### Task 2: Frontend Workspace Feature

**Files:**
- Create: `src/OpenSaur.Zentry.Web/client/src/features/workspaces/api/workspacesApi.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/workspaces/dtos/CreateWorkspaceRequestDto.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/workspaces/dtos/EditWorkspaceRequestDto.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/workspaces/dtos/WorkspaceDetailsDto.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/workspaces/dtos/WorkspaceSummaryDto.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/workspaces/dtos/AssignableWorkspaceRoleDto.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/workspaces/hooks/useCreateWorkspace.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/workspaces/hooks/useEditWorkspace.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/workspaces/hooks/useWorkspaceQuery.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/workspaces/hooks/useWorkspacesQuery.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/workspaces/hooks/useAssignableWorkspaceRolesQuery.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/workspaces/components/WorkspaceFiltersDrawer.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/workspaces/components/WorkspaceForm.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/workspaces/components/WorkspaceFormDrawer.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/features/workspaces/components/WorkspaceTable.tsx`
- Create: `src/OpenSaur.Zentry.Web/client/src/pages/WorkspacesPage.tsx`
- Modify: `src/OpenSaur.Zentry.Web/client/src/App.tsx`

- [ ] Add frontend API/query/mutation hooks for workspaces and assignable roles.
- [ ] Build workspace list/filter/create/edit UI using Zentry’s existing field, drawer, and confirmation patterns.
- [ ] Put assigned-role checkbox selection in the workspace form drawer and preload assigned roles on edit.
- [ ] Wire the `/workspaces` route to the new page.

### Task 3: Navigation and Visibility

**Files:**
- Modify: `src/OpenSaur.Zentry.Web/client/src/components/organisms/SideMenu.tsx`
- Modify: `src/OpenSaur.Zentry.Web/client/src/features/auth/hooks/AuthContext.tsx` or related auth surface only if needed for role-aware menu visibility
- Modify: `src/OpenSaur.Zentry.Web/client/src/pages/ForbiddenPage.tsx` only if copy needs workspace-specific updates

- [ ] Hide the `Workspaces` navigation item unless the current user is a super administrator.
- [ ] Keep API authorization enforced even if the menu item is hidden.
- [ ] Reuse current forbidden/redirect behavior for non-super-admin users who hit the route directly.

### Task 4: Verification

**Files:**
- Modify: `docs/superpowers/plans/2026-04-21-zentry-workspaces.md`

- [ ] Run `npm run build-dev` in `src/OpenSaur.Zentry.Web/client`.
- [ ] If backend restore/build is available locally, run `dotnet build src/OpenSaur.Zentry.Web/OpenSaur.Zentry.Web.csproj`.
- [ ] Manually verify super-admin access, workspace CRUD, and workspace role assignment behavior.
