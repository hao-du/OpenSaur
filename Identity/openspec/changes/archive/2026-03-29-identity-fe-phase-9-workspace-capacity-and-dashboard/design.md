## Context

The current system already supports workspace-scoped user management, workspace-owned role availability, and impersonation-aware navigation. This change extends those foundations with a workspace capacity setting and dashboard summaries without introducing a new permission model.

The workspace capacity rule is intentionally non-retroactive: lowering the limit below the current active-user count does not force deactivation. Enforcement applies only when an action would increase the active-user count. This keeps workspace edits operationally safe while still preserving the licensing boundary going forward.

## Goals / Non-Goals

**Goals:**
- Persist a nullable workspace maximum active-user count and expose it in workspace create/edit flows
- Enforce the limit during user creation and inactive-to-active transitions
- Surface assigned roles directly in workspace and user tables with compact overflow behavior
- Replace the empty dashboard with role-aware summary blocks
- Make the shell impersonation exit action icon-only while retaining usability

**Non-Goals:**
- No billing or payment workflow
- No retroactive forced deactivation when a workspace limit is lowered
- No changes to the existing permission hierarchy
- No audit/history slice for dashboard metrics in this change

## Decisions

### Decision: Store workspace capacity as a nullable integer on `Workspace`

`MaxActiveUsers` will be added to the workspace aggregate and API contracts. `null` means unlimited. This keeps the rule local to workspace management and avoids introducing a separate licensing table for a single capacity field.

Alternative considered:
- Separate licensing entity: rejected because this slice only needs one nullable limit and no billing lifecycle.

### Decision: Enforce capacity only on operations that increase active-user count

Create-user and edit-user flows will check the current active-user count only when:
- a new user is created as active
- an inactive user is reactivated

Editing an already-active user while keeping them active remains allowed, even if the workspace is already over limit. This matches the approved grandfathering rule.

Alternative considered:
- Block any save while over limit: rejected because it would make routine edits impossible once the limit is exceeded.

### Decision: Use a shared `2 chips + overflow popover` list pattern for role previews

Workspace and user list tables will render up to two role chips inline. Additional roles will collapse into a `+N` trigger that opens a popover. This keeps the tables scan-friendly while still exposing the full assignment set on demand.

Alternative considered:
- Full comma-separated text: rejected because long role names create poor readability and wrapping.

### Decision: Make the dashboard role-aware by session scope

The dashboard will keep the same structural layout but vary its data by session context:
- global super-admin at `All workspaces`: global summary cards
- workspace-scoped or impersonated session: workspace-specific cards, including capacity usage

Alternative considered:
- Same static dashboard for all sessions: rejected because the most useful metrics differ significantly between global and workspace-scoped contexts.

### Decision: Use icon-only impersonation exit with tooltip and accessible label

The shell header will replace the text button with an icon-only action. The control will keep a tooltip and an `aria-label` so the action remains discoverable and accessible.

## Risks / Trade-offs

- [Workspace limit checks race under concurrent user activation] → Perform the check inside the same request scope immediately before persistence and back it with tests
- [Dashboard summary scope could drift from route visibility rules] → Reuse current-user session context and existing route/permission rules instead of duplicating access logic
- [Role preview popovers can become noisy on smaller screens] → Keep inline previews capped to two chips and rely on a simple popover rather than expanding table rows

## Migration Plan

- Add a database migration for nullable `Workspace.MaxActiveUsers`
- Existing workspaces default to `null` and remain unlimited after deploy
- Frontend treats missing/null values as unlimited
- Rollback: remove frontend usage and revert migration if the change is not yet deployed broadly

## Open Questions

None for this slice.
