## Context

The current frontend already has hosted auth, callback completion, password rotation, and one protected route, but it does not yet have an application shell that can carry the rest of the admin experience. The next frontend phases depend on a stable layout contract: app bar, left navigation, responsive behavior, and role-aware route visibility. Without that shell, later workspace, user, and role pages would either duplicate layout concerns or force a large rework.

This slice intentionally stops before actual business CRUD behavior. The user wants the delivery order to be:

1. app shell and responsive layout
2. workspace + impersonation
3. users
4. roles

That means this change should establish the navigation and page skeleton now, while leaving the feature pages themselves as explicit placeholders.

## Goals / Non-Goals

**Goals:**
- Provide a responsive authenticated app shell for desktop, tablet, and mobile.
- Add role-aware navigation based on the current authenticated user.
- Replace the current home page with an empty dashboard route inside the new shell.
- Add clickable placeholder pages for `Workspace`, `Users`, and `Roles`.
- Keep shell-level UI reusable so later feature pages can drop into the main content area without reworking layout.

**Non-Goals:**
- Workspace CRUD or impersonation workflows
- User CRUD or role assignment workflows
- Role CRUD, permission assignment, or user assignment workflows
- New backend endpoints or auth contract changes
- Browser automation for this slice

## Decisions

### 1. Introduce a dedicated authenticated app-shell template

The current protected home page mixes shell concerns with page content. This slice should introduce a dedicated shell template that owns:
- top app bar
- left navigation
- responsive drawer/sidebar behavior
- main content outlet
- shell-level actions like logout

This keeps route pages focused on their own content and gives later pages a stable composition point.

Alternatives considered:
- Keep building the shell directly in `HomePage`: rejected because it tangles layout ownership with page content.
- Wait until workspace/users/roles pages exist: rejected because those later slices would then need to solve layout and page behavior at the same time.

### 2. Make navigation role-aware at the UI layer using current-user bootstrap data

The frontend already bootstraps the current authenticated user and roles. This slice should use those roles to determine which navigation items render:
- `SuperAdministrator`: `Dashboard`, `Workspace`, `Users`, `Roles`
- non-`SuperAdministrator`: `Dashboard`, `Users`

This is UI visibility, not security enforcement. Route protection still belongs to route guards and future page-level authorization.

Alternatives considered:
- Static navigation for all users: rejected because it conflicts with the approved shell design and would be reworked immediately.
- Server-generated navigation metadata: rejected because the existing current-user payload is enough for this slice and no new backend contract is needed.

### 3. Use permanent desktop sidebar plus tablet/mobile drawer

The shell should use:
- desktop: always-visible left sidebar
- tablet/mobile: top-bar menu button opening a drawer

This matches the approved responsive pattern and gives better space usage on smaller screens without compromising navigation discoverability on desktop.

Alternatives considered:
- Permanent sidebar on tablet too: rejected because the user explicitly chose drawer behavior for tablet.
- Drawer-only on all breakpoints: rejected because desktop loses the stable workspace-oriented navigation feel.

### 4. Use real routes for placeholder pages instead of disabled navigation items

The navigation items should be clickable now and land on proper placeholder pages marked as coming soon. That lets the shell, route highlighting, and responsive navigation be verified early.

Planned placeholder routes in this slice:
- `/`
- `/workspaces`
- `/users`
- `/roles`

Page visibility still follows the role-aware navigation rules.

Alternatives considered:
- Disabled nav items: rejected because they do not exercise routing or active-state behavior.
- Skip future routes entirely: rejected because the approved direction was clickable coming-soon pages.

### 5. Keep the dashboard intentionally empty, but shell-compliant

The dashboard route should intentionally remain empty for now, but it still needs to render inside the app shell and preserve the right spacing, headers, and responsive behavior. This prevents “temporary dashboard content” from turning into accidental product scope.

Alternatives considered:
- Reuse the current auth/session summary panel: rejected because the user explicitly wants the dashboard left empty.
- Add fake widgets for visual fill: rejected because it creates throwaway UI noise.

## Risks / Trade-offs

- [Role-aware nav may be mistaken for real authorization] -> Keep route/page authorization separate and treat this slice as navigation visibility only.
- [Clickable placeholders can feel unfinished] -> Use clear “coming soon” messaging so the routes are intentional, not broken.
- [Responsive shell changes may affect existing auth pages] -> Keep auth pages outside the app shell and only apply the new shell to authenticated app routes.
- [Later feature slices may need slightly different nav behavior] -> Centralize nav definitions so future changes happen in one place.

## Migration Plan

1. Add the new app-shell template and navigation components.
2. Move the protected dashboard route into the new shell.
3. Add role-aware nav visibility and route registration for placeholder pages.
4. Verify responsive behavior for desktop, tablet, and mobile using existing frontend test coverage where practical.
5. Leave workspace, user, and role behaviors for later changes.

Rollback can restore the previous single protected home route and remove the placeholder routes without affecting the auth foundation.

## Open Questions

- Whether the future initiative/workspace label in the top bar should initially reflect the authenticated workspace name or remain a static placeholder until the workspace slice is implemented.
