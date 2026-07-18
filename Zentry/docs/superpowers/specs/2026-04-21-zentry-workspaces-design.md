# Zentry Workspaces Design

## Goal

Port Workspace management from Identity into Zentry as a super-admin-only feature, including workspace CRUD and workspace role assignment management inside the same create/edit workflow.

## Scope

Included:
- backend workspace management endpoints in Zentry
- workspace list, create, edit, and status-changing behavior aligned with Identity
- workspace role assignment management in the same create/edit operation
- super-admin-only backend access control
- Zentry frontend list/create/edit/status-change UI for workspaces
- page routing and shell navigation inside the existing Zentry app
- side-menu visibility limited to super administrators

Excluded:
- impersonation
- broader user-management or role-management porting beyond what workspace role assignment directly needs
- broad authorization-system redesign
- migration execution
- unrelated admin areas

## Architecture

### Backend

Add a new backend feature slice under `Features/Workspaces` in Zentry. Keep the feature self-contained and aligned with the current Zentry structure:
- endpoint mapping
- create/edit/get/list/status-change handlers
- request/response DTOs
- FluentValidation validators
- workspace-role assignment helper logic

Use Zentry's existing `ApplicationDbContext`, `Workspace`, `WorkspaceRole`, and `ApplicationRole` entities directly.

Expected endpoint surface:
- `GET /api/workspace/get`
- `GET /api/workspace/getbyid/{id}`
- `POST /api/workspace/create`
- `PUT /api/workspace/edit`
- one status-changing endpoint matching Identity's behavior for deactivate/delete
- `GET /api/workspace/roles`

Create and edit requests should include the selected role ids so the workspace record and its role assignments are updated together in one backend operation.

### Authorization

Restrict all workspace endpoints to `SuperAdminOnly`.

Do not import Identity's broader admin authorization stack. Reuse Zentry's existing super-admin authorization guard so the workspace feature stays narrow and consistent with the OIDC client feature.

### Frontend

Replace the current `/workspaces` placeholder with a real workspace management page inside the existing Zentry shell.

The page should include:
- workspace list/table
- create workspace drawer
- edit workspace drawer
- role assignment checkbox list inside the same drawer
- confirmation dialog for destructive or status-changing actions

Use the existing Zentry app shell, shared dialog pattern, shared field components, and current theme/style system rather than copying Identity's shell structure verbatim.

## Data and Behavior Parity

Preserve the Identity-side workspace semantics for:
- `Name`
- `Description`
- `MaxActiveUsers`
- `IsActive`

Workspace role assignment behavior:
- load all assignable roles for the checkbox list
- preselect currently assigned roles when editing
- on save, replace the workspace's active role assignments with the submitted selection

The role-assignment UI lives inside the workspace create/edit drawer in this pass. It is not deferred to a separate dialog.

For status-changing behavior, preserve Identity's actual workspace behavior rather than inventing new semantics. If Identity deactivates instead of hard-deleting, Zentry should do the same.

## Navigation and Visibility

Keep the route at `/workspaces`.

Only super administrators should be able to:
- see the `Workspaces` entry in the side menu
- load the workspace management page
- call the workspace management API

Non-super-admins should be blocked at both the UI and API layers, consistent with the existing OIDC client management surface.

## Risks

The main risk is over-porting Identity-specific abstractions instead of feature behavior. Workspace management should reuse Zentry's existing shell, form, dialog, and authorization patterns instead of importing Identity-only helper layers.

Another risk is partial consistency between workspace CRUD and workspace-role assignment updates. The implementation should keep those changes together in one feature flow so a saved workspace and its assigned roles reflect the same submitted state.

## Verification

- backend build succeeds for `OpenSaur.Zentry.Web`
- frontend build succeeds with `npm run build-dev`
- manual verification confirms only super-admin users can see the `Workspaces` navigation item
- manual verification confirms only super-admin users can access the workspace page and API
- manual verification confirms list/create/edit/status-change flows behave like Identity's workspace management
- manual verification confirms workspace role assignment changes persist correctly from the checkbox list in the drawer
