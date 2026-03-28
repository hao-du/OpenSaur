# Workspace Impersonation Slice Design

## Context

The hosted app already has three important pieces in place:

- a same-host first-party auth flow with backend-assisted access-token and refresh-cookie handling
- a responsive authenticated shell that already has placeholder UI for impersonation state
- a real workspace management page for `SuperAdministrator`

What is still missing is the session switch itself. If `SuperAdministrator` wants to validate what a user in workspace `A` actually sees, the current app cannot replace the first-party session and cannot restore the original super-admin session later. The existing in-memory access token model also means a session switch must explicitly synchronize other tabs.

## Goals / Non-Goals

**Goals:**

- Let `SuperAdministrator` start impersonation from the workspace list.
- Support two effective identities:
  - an active `SuperAdministrator` in the selected workspace context
  - an active user inside the selected workspace
- Make impersonation session-wide across browser tabs.
- Restore the original super-admin session without requiring a fresh login.
- Expose impersonation state through `/api/auth/me` so the shell can render active workspace and exit affordances without page-local props.

**Non-Goals:**

- Nested impersonation
- Audit/history UI for impersonation
- Persisting impersonation state in the database
- Building the future `Users` or `Roles` management pages in this slice

## Decisions

### 1. Impersonation is implemented as an auth-helper flow, not a directory-management flow

Impersonation changes the effective authenticated session, refresh-cookie behavior, and current-user context. That makes `/api/auth/*` the correct backend surface instead of `/api/workspace/*` or `/api/user/*`.

Alternatives considered:

- Reuse `/api/user/get` and `/api/workspace/*` directly for session switching.
  - Rejected because the hard part is session replacement, not data lookup.
- Create a separate BFF-only impersonation subsystem.
  - Rejected because the current first-party auth helpers already own browser session setup and refresh.

### 2. Start/exit impersonation returns replacement first-party tokens immediately

The impersonation endpoints will update the ASP.NET Identity application cookie, mint a replacement first-party access token and refresh token, set the rotated refresh cookie, and return the new access-token payload in the same shape as the existing web-session exchange/refresh endpoints.

Alternatives considered:

- Force the frontend back through `/connect/authorize` after impersonation start/exit.
  - Rejected because it adds an unnecessary redirect loop and complicates tab synchronization.
- Reuse the existing refresh token after changing only the application cookie.
  - Rejected because the refresh token principal would continue representing the old identity.

### 3. Impersonation state is carried in claims, not database tables

The app will preserve the original super-admin identity in auth claims and rebuild token claims from that state. The minimal extra claims are:

- impersonation active flag
- original super-admin user id
- effective workspace override id

That keeps the feature deployable without a migration and lets exit-impersonation restore the original user by loading the original user id from the current authenticated principal.

### 4. Tab synchronization is explicit and frontend-driven

When impersonation starts or ends, the current tab will:

- replace the local access token
- refresh the current-user query
- broadcast a session-refresh signal to other tabs

Other tabs will react by refreshing the backend-managed session instead of trying to share access tokens directly between tabs.

Alternatives considered:

- Ignore cross-tab synchronization and wait for token expiry.
  - Rejected because it violates the required session-wide behavior.
- Share access tokens directly through persistent browser storage.
  - Rejected because the app intentionally keeps access tokens in memory only.

### 5. Workspace page owns the launch UI; shell owns the active-session affordance

The workspace page will own the `Login as` dialog and candidate loading. The dialog will merge:

- active users from the selected workspace
- active users who hold `SuperAdministrator`

The user picker will be searchable so long lists remain usable. The protected shell will read impersonation state from `/api/auth/me` and render:

- active workspace label
- exit impersonation action only when impersonation is active

That keeps page-specific launch behavior out of the shell while making the shell the source of truth for current session state.

## Risks / Trade-offs

- [Impersonation token issuance diverges from login/callback flow] → Reuse the existing first-party token infrastructure and keep the response contract identical to existing web-session handlers.
- [Claims-driven impersonation could drift from current-user API shape] → Centralize impersonation claim parsing in auth helpers and cover `/api/auth/me` with endpoint tests.
- [Tab refresh race conditions] → Broadcast only a refresh signal, not token data, and let each tab refresh through the backend-managed cookie path.
- [Super-admin-as-workspace still carries super-admin permissions] → This is intentional; the “Login as Super Administrator” option is a workspace-context switch, not a role downgrade.
