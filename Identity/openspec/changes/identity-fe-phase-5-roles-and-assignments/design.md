## Context

The backend already supports global role definitions under `/api/role/*`, permission listing under `/api/permission/get`, and workspace-scoped user-role assignment mutations under `/api/user-role/*`. The frontend shell already understands super-admin and impersonation state through `/api/auth/me`, but both `Roles` and any workspace-scoped role-assignment UI are still missing.

The requested behavior separates two concerns:

- global role definition and permission mapping for real super-admin sessions
- workspace-scoped assigned-user management for impersonated super-admin sessions

That split is important because the same session can move between `All workspaces` and an impersonated workspace, and the UI should make the boundary explicit instead of overloading one editor.

## Goals / Non-Goals

**Goals:**
- Provide a real `Roles` page for super-admin sessions.
- Keep global role metadata and permission editing separate from workspace-scoped assigned-user management.
- Add an impersonation-only `Role Assignments` route and navigation item.
- Limit assigned-user management to active users in the impersonated workspace.
- Reuse existing backend contracts where possible and add only the minimal role-assignment read support needed by the frontend.

**Non-Goals:**
- Reworking the permission model or adding new permission types
- Introducing role ownership by workspace
- Adding non-superadmin access to role-definition screens
- Implementing the broader `Users` slice in this change

## Decisions

### 1. Split role definition and role assignment into separate routes

The change will create two frontend surfaces:

- `/roles` for global role definition
- `/role-assignments` for workspace-scoped assigned-user management during impersonation

This keeps the editor shape stable per route. It avoids one page changing sections, save semantics, and intent based on session mode.

Alternatives considered:
- Keep one `Roles` page and switch sections based on impersonation state.
  - Rejected because it creates a UI with conflicting meanings for `Edit`.
- Move assigned-user management into the future `Users` slice.
  - Rejected because the requested workflow is role-centric during impersonation.

### 2. Role-definition actions stay available to super-admin sessions, including impersonated ones

Super-admin sessions at `All workspaces` can list, add, and edit global roles. Impersonated super-admin sessions can also keep those role-definition actions because they still operate on the same global role records. During impersonation, the shell additionally exposes `Role Assignments` for workspace-scoped changes.

This preserves a clear operational boundary:
- all super-admin sessions can manage global role definitions
- impersonated super-admin sessions additionally manage workspace assignments

### 3. Role assignments stay workspace-scoped and impersonation-aware

The assignment UI will use the impersonated workspace from the authenticated session as its scope. Candidate users and existing assignments will be resolved only for that workspace. The assigned-user picker will show active users only, and each option will include a small workspace label even though the list is scoped, so the UI remains explicit and reusable.

Alternatives considered:
- Show all users across all workspaces and rely on labels to explain scope.
  - Rejected because it weakens the impersonation boundary.

### 4. Backend read support will be extended instead of overfetching generic lists

The current role and user-role APIs are close, but the frontend still needs:
- role-scoped assignment data for a selected role
- active user candidates in the current managed scope

The change will add targeted read support rather than forcing the frontend to fetch every assignment and every user and rebuild the model client-side.

### 5. Shell navigation visibility is derived from authenticated session state

The shell already knows whether the current user is impersonating and whether they are a super-admin. That state will drive:
- `Roles` visibility for super-admin sessions
- `Role Assignments` visibility only for impersonated super-admin sessions
- `Workspace` visibility only for non-impersonated super-admin sessions

This keeps navigation deterministic and aligned with session state across tabs.

## Risks / Trade-offs

- [Global roles remain shared while assignments are workspace-scoped] → Keep the split explicit in route names, page copy, and access rules.
- [Adding a new backend read path could overlap with existing user-role queries] → Reuse repository scope rules and add focused tests for impersonated workspace behavior.
- [Super-admin session mode affects navigation and actions] → Drive visibility from `/api/auth/me` and cover both normal and impersonated shell states in frontend tests.
- [Assigned-user picker options all belong to one workspace, making the workspace label look redundant] → Keep the label anyway for clarity and future consistency with other pickers.
