# Identity FE Phase 4 Workspace Impersonation Implementation Plan

## 1. OpenSpec

- [x] 1.1 Finalize the phase-4 impersonation proposal, design, and specs for backend-assisted session switching and workspace-driven login-as UX.
- [x] 1.2 Validate the change with `openspec validate identity-fe-phase-4-workspace-impersonation`.

## 2. Backend auth session support

- [x] 2.1 Add impersonation-aware auth claim parsing and extend the current-user response with workspace and impersonation metadata.
- [x] 2.2 Add backend auth endpoints to load workspace impersonation candidates, start impersonation, and exit impersonation.
- [x] 2.3 Extend first-party token issuance so impersonation start/exit returns replacement access/refresh tokens without forcing a browser re-login.
- [x] 2.4 Update OIDC principal creation so impersonation state survives authorize, refresh, and restored-session flows.

## 3. Frontend impersonation flow

- [x] 3.1 Add frontend auth API and hook support for impersonation options, start, exit, and session-wide tab refresh signaling.
- [x] 3.2 Replace the workspace-table placeholder action with a real login-as dialog and start-impersonation flow.
- [x] 3.3 Bind the protected shell to authenticated impersonation state so it shows active workspace context and exit action from `/api/auth/me`.
- [x] 3.4 Ensure impersonation start navigates into the protected app and exit restores the current shell state without forcing manual re-login.

## 4. Verification

- [x] 4.1 Add backend tests for impersonation options, start, exit, and impersonation-aware `/api/auth/me`.
- [x] 4.2 Add frontend tests for the workspace login-as flow, shell impersonation state, and tab-sync session refresh behavior.
- [x] 4.3 Run targeted frontend tests, targeted backend tests, `npm run build`, and `openspec validate identity-fe-phase-4-workspace-impersonation`.
