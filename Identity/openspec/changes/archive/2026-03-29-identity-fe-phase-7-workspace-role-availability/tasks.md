## 1. OpenSpec

- [x] 1.1 Add the `identity-fe-workspace-role-availability` capability spec for workspace-owned role availability and downstream role visibility.
- [x] 1.2 Update `identity-authentication` and `identity-directory-management` specs for effective-role filtering and workspace-role persistence.

## 2. Backend Persistence And Enforcement

- [x] 2.1 Add the workspace-role mapping entity, EF configuration, repository support, and migration/backfill for active non-reserved roles on existing workspaces.
- [x] 2.2 Extend workspace create, edit, and get-by-id flows to load and save assigned role ids, and deactivate matching workspace user-role assignments when roles are removed.
- [x] 2.3 Update effective role resolution, permission checks, and workspace-scoped user-role read/write validation to honor workspace role availability.

## 3. Frontend Workspace And Downstream Screens

- [x] 3.1 Add the `Assigned Roles` section to the workspace create/edit drawers and wire the selected role ids through the workspace hooks and API types.
- [x] 3.2 Update `Users` assigned-role candidates to use workspace-scoped available roles only.
- [x] 3.3 Update `Role Assignments` to list only workspace-available roles for the impersonated workspace.

## 4. Verification

- [x] 4.1 Add or update frontend tests for workspace role editing, users role candidates, and role-assignments filtering.
- [x] 4.2 Add or update backend tests for workspace-role persistence, removed-role assignment deactivation, effective-role filtering, and workspace-scoped candidate reads.
- [x] 4.3 Run targeted frontend tests, targeted backend tests, `npm run build`, `dotnet build`, and `openspec validate identity-fe-phase-7-workspace-role-availability`.
