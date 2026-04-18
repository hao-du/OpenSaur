# Zentry Phase 1 Hybrid SPA Authentication Design

## Goal

Deliver the first working slice of `Zentry` as a single-page application that authenticates through `CoreGate`, uses a browser-side access token for direct API calls, and relies on a `CoreGate`-managed `HttpOnly` refresh-token cookie to renew access without exposing the refresh token to JavaScript.

This phase ends at a simple authenticated dashboard. CRUD management APIs remain out of scope.

## Scope

### In Scope

- Keep `Zentry` as a true SPA.
- Authenticate users through `CoreGate` using authorization code flow with PKCE.
- Return an access token to the SPA for direct bearer-token API use.
- Keep refresh token out of JavaScript by having `CoreGate` store or issue it through an `HttpOnly` cookie flow.
- Add a refresh path that the SPA can trigger without ever reading the refresh token value.
- Render a protected dashboard page after successful login.
- Support logout through `CoreGate` end-session flow.

### Out of Scope

- User, role, permission, workspace, or OIDC client CRUD APIs.
- A `Zentry` BFF that proxies all future CRUD traffic.
- Refresh-by-userId or any non-secret refresh shortcut.
- Long-term authorization policy modeling for downstream services.
- Full microservice topology design beyond the auth contract needed for phase 1.

## Architecture

This is a hybrid model, not a pure browser-token SPA and not a full BFF.

- `CoreGate` remains the identity provider.
- `Zentry` remains a browser SPA.
- `Zentry` JavaScript holds the short-lived access token.
- `CoreGate` owns refresh-token lifecycle and keeps refresh capability bound to an `HttpOnly` cookie or equivalent provider-side session state.

This gives `Zentry` direct frontend bearer-token calls while reducing the exposure of the refresh token itself.

## Authentication Flow

### Login

1. User opens `Zentry`.
2. `Zentry` checks whether a valid access token is already available in client auth state.
3. If not, `Zentry` starts the OIDC authorization code flow with PKCE against `CoreGate`.
4. User authenticates on the `CoreGate` login screen.
5. `CoreGate` redirects back to the `Zentry` callback with an authorization code.
6. `Zentry` exchanges the code with `CoreGate`.
7. `CoreGate` returns:
   - an access token for browser-side bearer use
   - optional ID token for identity/bootstrap/logout hints
   - refresh capability managed outside JavaScript, via `HttpOnly` cookie and provider-side token state
8. `Zentry` stores only the access-token-side auth state needed by the SPA and enters the dashboard route.

### Direct API Usage

For this model, `Zentry` frontend attaches the access token as `Authorization: Bearer <token>` when calling direct APIs. That is the deliberate tradeoff that keeps the app a true SPA.

### Refresh

1. `Zentry` tracks access token expiry.
2. Before expiry, the frontend calls a refresh endpoint flow.
3. Browser sends the `HttpOnly` refresh cookie automatically.
4. `CoreGate` validates the refresh context using its own provider-side token/session state.
5. `CoreGate` rotates refresh state as needed and returns a new access token.
6. `Zentry` replaces the old access token in frontend auth state.

The frontend never reads or sends the raw refresh token value.

### Logout

1. User clicks logout in `Zentry`.
2. `Zentry` clears frontend auth state.
3. Browser is redirected through `CoreGate` end-session flow.
4. `CoreGate` clears its provider-side login session and refresh-cookie state.
5. Browser returns to a public `Zentry` route.

## Storage Model

### JavaScript-Accessible State

`Zentry` frontend may store:

- current access token
- access token expiry
- minimal identity/bootstrap data needed for UI
- optional ID token only if required for logout flow integration

### Non-JavaScript State

Refresh capability must be stored outside JavaScript:

- `HttpOnly`
- `Secure`
- provider-managed
- unavailable to browser scripts

The frontend should not persist the refresh token in:

- memory variables
- `sessionStorage`
- `localStorage`
- JS-readable cookies

## CoreGate Contract

For this architecture to work cleanly, `CoreGate` must provide a refresh mechanism that does not depend on the browser sending a raw refresh token string from JavaScript.

That means one of these provider-owned patterns:

1. `CoreGate` sets an `HttpOnly` refresh cookie and accepts it on refresh requests.
2. `CoreGate` keeps refresh state server-side and binds it to a provider cookie/session.

For phase 1, the contract should stay narrow:

- authorize
- token exchange
- user info or equivalent identity bootstrap
- refresh using provider-owned cookie/session state
- end session/logout

## Security Notes

This is a compromise architecture.

It is stronger than a SPA that stores both access and refresh tokens in browser-managed storage, because refresh capability stays out of JavaScript.

It is weaker than a full BFF, because the browser still carries an access token for direct API calls.

Required controls for this model:

- PKCE on authorization code flow
- short access-token lifetime
- refresh-token rotation on refresh
- CSRF protection or equivalent origin checks on refresh/logout endpoints because cookies are sent automatically
- strict CSP and XSS hardening in `Zentry`
- no refresh-by-userId design
- no custom refresh shortcut that treats identifiers as credentials

## Frontend Behavior

The first dashboard should remain intentionally small:

- login redirect
- callback handling
- access token state
- refresh scheduling
- user identity bootstrap
- logout
- one protected dashboard route

The refresh trigger may be timer-based for the first slice, but it should be conservative and retry-aware rather than firing continuously.

## Success Criteria

Phase 1 is successful when:

- unauthenticated entry redirects to `CoreGate`
- login through `CoreGate` returns to `Zentry`
- `Zentry` receives and stores a usable access token for direct API calls
- refresh can occur without exposing refresh token to JavaScript
- the dashboard renders after successful login
- logout clears both frontend auth state and provider-side session state

## Deferred Work

- CRUD APIs and downstream service authorization
- decision on exactly which direct APIs `Zentry` calls first
- full CSRF design for refresh/logout endpoints
- refresh failure UX and re-auth retry policy
- multi-service token forwarding rules
- whether `Zentry` should later move to a fuller BFF for admin operations
