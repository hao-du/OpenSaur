## Why

The admin shell now has the core workspace, user, role, and impersonation flows, but it is still missing workspace capacity control, fast role visibility in list views, and a dashboard that reflects the current session scope. These gaps make it harder to manage licensed workspaces and to understand workspace state quickly.

## What Changes

- Add a nullable `MaxActiveUsers` field to workspace management, where `null` means unlimited.
- Enforce the workspace active-user limit when creating a new active user or reactivating an inactive user.
- Allow existing active users to remain active when a workspace limit is lowered below current usage.
- Add `Roles` columns to the workspace and user lists with a `2 chips + overflow popover` display pattern.
- Replace the text `Exit impersonation` action with an icon-only shell control that keeps tooltip and accessibility support.
- Replace the empty dashboard with role-aware summary blocks for global super-admin and workspace-scoped sessions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `identity-fe-app-shell`: dashboard content and impersonation exit control behavior change
- `identity-fe-workspaces`: workspace management gains active-user capacity and list role previews
- `identity-fe-users`: user management gains workspace-capacity enforcement and list role previews

## Impact

- Workspace domain model, persistence, migrations, and API contracts
- User create/edit backend validation and frontend error handling
- Workspace and user list UI rendering
- Protected shell header behavior and dashboard UI
- Frontend and backend tests for workspace capacity and dashboard summaries
