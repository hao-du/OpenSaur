# Zentry Phase 1 SPA Authentication Design

## Goal

Deliver the first working slice of `Zentry` as a true SPA that authenticates users through `CoreGate`, receives bearer tokens through a standard OpenID Connect authorization code flow with PKCE, and lands on a simple protected dashboard page after login.

This phase does not include CRUD management APIs, database writes, or migration of legacy `Identity` management endpoints.

## Scope

### In Scope

- Create a minimal `Zentry` SPA application shell.
- Register `Zentry` as an OIDC client that authenticates against `CoreGate`.
- Redirect unauthenticated users from `Zentry` to the `CoreGate` login flow.
- Handle the OIDC callback in `Zentry`.
- Exchange the authorization code for tokens using PKCE.
- Store the resulting token set in frontend-managed auth state.
- Optionally call `CoreGate` user info to populate the dashboard.
- Render a simple protected dashboard page after successful login.
- Support a basic logout path that clears local auth state and returns through `CoreGate` end-session flow.

### Out of Scope

- Any CRUD API for users, roles, permissions, workspaces, or OIDC clients.
- Any server-backed session or cookie-based authentication in `Zentry`.
- Any migration of existing `Identity` admin feature code into `Zentry`.
- Multi-app SSO orchestration beyond the `Zentry` and `CoreGate` login/logout flow.
- Advanced token refresh UX, silent renew iframes, background sync, or role-based route trees beyond one protected dashboard route.

## Architecture

`CoreGate` is the only identity provider in this phase. It continues to own the login UI, authorization endpoint, token endpoint, end-session endpoint, and user info endpoint.

`Zentry` is a frontend-only OIDC client. It does not mint tokens, validate passwords, or create backend sessions. It initiates the authorization request in the browser, receives the authorization code on its frontend callback route, exchanges the code with `CoreGate`, and keeps the resulting auth state in frontend-controlled storage for use by the SPA.

This keeps the responsibility split clean:

- `CoreGate`: authenticate user, issue tokens, expose OIDC endpoints.
- `Zentry`: behave like a standards-based SPA client and render the protected UI.

## Authentication Flow

### Login

1. User opens `Zentry`.
2. `Zentry` checks whether a valid token set is already present in its auth state.
3. If no valid token exists, `Zentry` generates PKCE parameters and a `state` value.
4. `Zentry` redirects the browser to `CoreGate /connect/authorize`.
5. `CoreGate` checks its own login session.
6. If the user is not authenticated in `CoreGate`, `CoreGate` presents its login UI.
7. After successful login, `CoreGate` issues an authorization code and redirects back to the `Zentry` callback URI.
8. `Zentry` validates the returned `state`.
9. `Zentry` exchanges the code at `CoreGate /connect/token` using the stored PKCE verifier.
10. `Zentry` stores the resulting token set and enters the authenticated dashboard route.

### Dashboard Load

After login, `Zentry` may call `CoreGate /connect/userinfo` with the access token to build a minimal dashboard model. The initial dashboard only needs enough information to prove the end-to-end login worked, such as subject, preferred username, email, workspace, and role claims if present.

### Logout

1. User clicks logout in `Zentry`.
2. `Zentry` clears locally stored token state and transient PKCE/auth state.
3. `Zentry` redirects the browser to `CoreGate /connect/endsession`.
4. `CoreGate` clears its provider-side login session and returns the browser to a public `Zentry` route.
5. `Zentry` shows the unauthenticated entry state and will start login again when protected navigation is attempted.

## Token Model

For this phase, `Zentry` stores:

- access token
- refresh token if `CoreGate` issues one for the configured scopes and client type
- expiry metadata
- ID token if returned and needed for SPA identity bootstrap

The frontend will attach the bearer access token only when calling protected provider endpoints such as `/connect/userinfo`. Since CRUD APIs are out of scope, phase 1 does not yet define a broader API calling pattern.

## Client Registration Requirements

`CoreGate` must contain an OIDC client registration for `Zentry` with:

- SPA-appropriate redirect URI
- post-logout redirect URI back to `Zentry`
- authorization code flow enabled
- PKCE required
- scopes needed for the dashboard identity bootstrap

`Zentry` should use configuration for:

- authority base URL
- client ID
- redirect URI
- post-logout redirect URI
- requested scopes

These values must be environment-specific and must not be hard-coded as production values.

## Frontend Structure

`Zentry` only needs a minimal structure in phase 1:

- public entry route
- auth callback route
- protected dashboard route
- auth state management module
- OIDC client helper module

The first dashboard should be intentionally small. Its job is to confirm successful authentication and display basic identity information, not to preview the full management application.

## Error Handling

`Zentry` must explicitly handle these cases:

- missing or mismatched `state`
- missing authorization code on callback
- token exchange failure
- expired token with no usable refresh path
- user info request failure after successful login
- logout return without valid local auth state

The UI for this phase can stay simple: show a small auth error panel with a retry action that restarts login.

## Security Notes

This design accepts the tradeoff of a true SPA bearer-token model because it matches the chosen architecture. To keep risk bounded in phase 1:

- Use authorization code flow with PKCE only.
- Never use implicit flow.
- Keep requested scopes minimal.
- Keep auth state isolated in a dedicated module.
- Do not introduce CRUD APIs in the same phase.
- Do not mix cookie-based app auth with the SPA bearer model.

This is not the strongest browser-side security posture compared with a backend-managed session architecture, but it is coherent and standard for a true SPA client.

## Success Criteria

Phase 1 is successful when:

- Visiting `Zentry` as an unauthenticated user causes a redirect to `CoreGate`.
- Logging in through `CoreGate` returns the browser to `Zentry`.
- `Zentry` successfully exchanges the authorization code for tokens.
- `Zentry` renders a protected dashboard page after login.
- The dashboard can display at least a small set of authenticated user identity fields.
- Logging out removes local auth state and returns through `CoreGate` end-session flow.

## Deferred Work

These items should be requested separately after phase 1:

- `Zentry` backend and CRUD APIs
- bearer-token validation for `Zentry` APIs
- migration of legacy `Identity` management features
- authorization policies for admin actions
- token refresh strategy and expiry UX
- route-level permission gating inside `Zentry`
