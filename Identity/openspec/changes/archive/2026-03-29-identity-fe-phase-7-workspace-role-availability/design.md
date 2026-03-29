## Context

The current system has global role definitions, workspace-scoped users, and workspace-scoped user-role assignment flows, but it has no notion of whether a role is available inside a specific workspace. As a result:

- `Users` can offer role candidates that are irrelevant to the current workspace
- `Role Assignments` can show roles that should not be usable in the impersonated workspace
- removing a role from an organizational workflow cannot be modeled without deleting or deactivating the global role itself

This change adds a workspace-owned mapping while preserving the existing reserved `SuperAdministrator` behavior.

## Goals / Non-Goals

**Goals:**
- Let `Workspace` create/edit manage assigned active roles for that workspace.
- Keep `SuperAdministrator` excluded from workspace role assignment and treat it as a reserved exception.
- Filter workspace-scoped role visibility in `Users` and `Role Assignments`.
- Ensure effective role claims and permission checks ignore unmapped workspace roles.
- Prevent hidden stale assignments from continuing to grant access after a role is removed from a workspace.

**Non-Goals:**
- Moving role-to-workspace management onto the `Roles` page
- Changing global role-definition or permission-management behavior
- Adding cross-workspace role assignment from `Users` or `Role Assignments`
- Introducing delete endpoints for workspace-role mappings

## Decisions

### 1. Add an app-owned `WorkspaceRole` mapping table

The mapping is a first-class part of workspace administration, not a derived join built on the fly. The new table will relate a workspace to a role, support audit fields plus `IsActive`, and be queried through a dedicated repository path.

This keeps workspace-owned role availability explicit and lets the backend reuse one source of truth for:

- workspace editor state
- workspace-scoped role lists
- workspace-scoped role candidate filtering
- effective permission resolution

### 2. Workspace create and edit flows own role availability

The `Workspace` form will gain an `Assigned Roles` section. It will show all active roles except `SuperAdministrator`, and create/edit requests will submit selected role ids.

To preserve current live behavior and avoid making existing workspaces unusable overnight:

- the migration/backfill will assign all currently active non-reserved roles to all existing workspaces
- the create flow will default the assigned-role selection to all active non-reserved roles

That preserves today's behavior until a super administrator narrows the workspace deliberately.

### 3. Removing a role from a workspace deactivates matching user-role assignments in that workspace

Filtering UI candidates alone is insufficient. Without cleanup, hidden active user-role assignments could remain in the database and reappear unexpectedly later.

When a workspace edit removes a role from that workspace, the backend will deactivate active user-role assignments for:

- users in that workspace
- the removed role ids

This keeps stored assignments aligned with visible workspace intent.

### 4. Effective role and permission resolution will honor workspace role availability for non-reserved roles

Role claims and permission checks currently read from active user-role assignments only. That must be tightened so non-reserved roles are only effective when the workspace-role mapping is also active for the user's effective workspace.

`SuperAdministrator` remains the reserved exception:

- it is never managed through workspace role assignment
- it remains effective regardless of workspace mapping

### 5. Downstream admin screens will consume workspace-scoped role availability instead of global role lists

Two surfaces need to change:

- `Users`: assigned-role candidates must be limited to roles available in the current workspace
- `Role Assignments`: the role list itself must be limited to roles available in the impersonated workspace

This will use backend workspace-scoped read paths instead of client-side filtering over the global roles list.

## Risks / Trade-offs

- [New role availability model introduces a schema change] -> Add a focused migration plus targeted repository and endpoint coverage; do not auto-run the migration.
- [Workspace role removal could silently break expected access] -> Deactivate matching workspace user-role assignments during workspace edit and cover it with tests.
- [Newly created global roles are not immediately usable anywhere unless assigned] -> Keep role availability owned by `Workspace`; document that new roles must be assigned from workspace management before workspace-scoped admins can use them.
- [Authentication and authorization now depend on another join] -> Centralize the workspace-role join in repository and permission-resolution paths instead of duplicating ad hoc filters.

## Migration Plan

1. Add the `WorkspaceRoles` table and update the EF model snapshot.
2. Backfill all existing workspaces with all active non-reserved roles so current behavior is preserved after deployment.
3. Do not auto-run the migration from Codex; the generated migration must be reviewed and applied manually by the user.
4. After the migration is applied, new workspace edits become the source of truth for workspace role availability.

## Open Questions

- None for this slice.
