## 1. Workspace Capacity Backend

- [x] 1.1 Add nullable `MaxActiveUsers` to the workspace domain model, persistence configuration, and migration
- [x] 1.2 Extend workspace create/edit/get handlers and contracts to read and write `MaxActiveUsers`
- [x] 1.3 Add backend validation for active-user capacity during user create and inactive-to-active user edits
- [x] 1.4 Add backend tests for workspace limit persistence and user-capacity enforcement

## 2. Workspace And User Management UI

- [x] 2.1 Add the max-active-users field to the workspace create/edit drawer and bind blank input to `null`
- [x] 2.2 Add a shared role-preview UI pattern with `2 chips + overflow popover`
- [x] 2.3 Apply the role-preview pattern to the workspace list
- [x] 2.4 Apply the role-preview pattern to the user list
- [x] 2.5 Surface workspace-capacity validation errors in the user create/edit flows

## 3. Shell And Dashboard

- [x] 3.1 Replace the text `Exit impersonation` action with an icon-only control with tooltip and accessible label
- [x] 3.2 Implement role-aware dashboard summary blocks for global and workspace-scoped sessions
- [x] 3.3 Add frontend tests for shell impersonation action, role previews, and dashboard variants

## 4. Verification

- [x] 4.1 Run targeted backend build and tests for workspaces, users, and dependency injection
- [x] 4.2 Run targeted frontend tests and production build for workspace, user, shell, and dashboard flows
- [x] 4.3 Validate `identity-fe-phase-9-workspace-capacity-and-dashboard` and update the task checklist
