## Why

Roles are currently global in practice, so every workspace-scoped user-management surface can see the same non-reserved roles. That is too broad for organizational workspaces where only a subset of roles should be assignable, and it leaves no workspace-owned control point for limiting role visibility.

## What Changes

- Add workspace-owned role availability mapping managed only from the `Workspace` create and edit flows.
- Let super administrators assign and unassign active non-reserved roles for a workspace.
- Extend workspace create and edit operations to persist assigned role ids along with the workspace record.
- Filter workspace-scoped role lists and role candidates so users only see roles assigned to the current workspace.
- Ensure effective workspace-scoped role and permission resolution ignores roles that are no longer assigned to the user's workspace, while keeping `SuperAdministrator` as the reserved exception.
- Deactivate workspace user-role assignments when a role is removed from that workspace so role access does not linger invisibly.

## Capabilities

### New Capabilities
- `identity-fe-workspace-role-availability`: Workspace-owned role availability management and workspace-scoped role visibility for downstream admin screens.

### Modified Capabilities
- `identity-authentication`: Issued effective role claims and permission-derived access behavior must honor workspace role availability for non-reserved roles.
- `identity-directory-management`: Workspace, user-role, and role-assignment APIs must persist and enforce workspace role availability.

## Impact

- Affected frontend code: `src/OpenSaur.Identity.Web/client/src/pages/workspaces/**`, `src/OpenSaur.Identity.Web/client/src/pages/users/**`, `src/OpenSaur.Identity.Web/client/src/pages/role-assignments/**`, and supporting hooks/components.
- Affected backend code: `src/OpenSaur.Identity.Web/Features/Workspaces/**`, `src/OpenSaur.Identity.Web/Features/UserRoles/**`, authentication principal/permission resolution, and workspace/role repositories.
- Affected persistence: a new workspace-role mapping table and migration/backfill are required; migrations must be reviewed and applied manually by the user.
- Affected tests: workspace page tests, users page tests, role-assignments page tests, user-role endpoint tests, auth endpoint tests, and authorization tests.
