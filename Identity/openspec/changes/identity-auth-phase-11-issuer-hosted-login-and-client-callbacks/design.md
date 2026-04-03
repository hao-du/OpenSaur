## Context

The current Identity browser flow is intentionally same-host:

- the hosted login page posts credentials to `/api/auth/login` on the current host
- the frontend then starts OIDC authorization from the current origin
- the frontend derives `redirect_uri` from `window.location.origin`
- backend configuration only models one `Oidc:FirstPartyWeb` client with one redirect URI

That shape is convenient for the current Identity-hosted SPA, but it couples login UX and redirect handling to whichever app the user is visiting. As soon as another browser app on a different origin needs to authenticate, the current approach either forces that app to host its own credential-entry experience or pushes us toward a custom shared-callback broker.

The preferred architecture is the standard OIDC model:

- the issuer owns credential entry and the hosted authentication session
- each browser app is its own OIDC client
- each browser app has its own exact registered callback URI on its own origin
- the issuer can reuse its hosted session across those clients

## Goals / Non-Goals

**Goals:**

- Move browser credential entry to the issuer configured by `Oidc:Issuer`.
- Require exact per-client redirect URIs instead of origin-derived callbacks.
- Support more than one browser client without inventing a shared callback broker.
- Preserve hosted SSO across registered clients when the issuer session is still valid.
- Keep the current backend-assisted refresh-cookie pattern available for first-party browser clients that want it.

**Non-Goals:**

- A shared callback endpoint such as one `/auth/callback` that all browser apps use through custom brokering.
- Replacing OpenIddict or moving away from authorization code flow.
- Designing mobile/native client behavior in this slice.
- Building every downstream browser app that will eventually consume this model.
- Reworking non-auth admin screens beyond the auth-start/callback boundary needed for this slice.

## Decisions

### 1. Each browser client owns exact callback URIs on its own origin

Each browser client will be treated as a standard OIDC client with its own exact registered redirect URI(s). The issuer will redirect the browser only to the callback URI registered for the requesting client, and authorization requests with an unregistered redirect URI will be rejected.

This keeps the solution aligned with standard OAuth/OIDC redirect-uri matching instead of introducing a central callback broker.

Alternatives considered:

- One shared callback on the issuer domain for every browser app: rejected because it turns the issuer into a custom callback broker and increases cross-app coupling.
- Derive callback URI from `window.location.origin`: rejected because it is convenient only for same-host setups and does not produce an explicit registration contract.

### 2. The issuer owns browser credential entry and hosted sign-in UX

Browser apps should not need to host their own credential-entry experience just to authenticate through the shared issuer. If a browser app starts an authorization request without an existing hosted session, the user should be sent to the issuer-hosted login UI on the issuer domain. Once authenticated, the issuer redirects back to the requesting client's registered callback URI.

The current login API can remain part of the issuer-hosted login experience, but it should no longer be the browser-login entry point for unrelated app hosts.

### 3. Browser client registration becomes explicit and multi-client

The current `Oidc:FirstPartyWeb` options shape is too narrow because it assumes one client, one redirect URI, and one callback ownership model. This slice should move toward an explicit browser-client registration model that can represent:

- client identifier
- client secret or public-client mode as needed
- exact redirect URI(s)
- exact post-logout redirect URI(s) when supported in the same slice
- scopes/permissions needed by that client
- a designation for the hosted Identity admin shell client when different defaults or UX behavior apply

The initial implementation can stay configuration-driven; moving client registration to an admin-managed data model can remain a later change.

### 4. The hosted first-party auth shell uses configured issuer and configured callback values

The current hosted frontend builds OIDC authorization requests from the current origin. That must change. The auth shell should build authorization requests from:

- the configured issuer authority
- the client's registered redirect URI
- the existing client id/scope settings

This removes the hidden assumption that the current browser host is always the correct callback owner.

### 5. Hosted SSO remains session-based at the issuer, not callback-based

Cross-app SSO should continue to come from the issuer's hosted authentication session. If the user has already authenticated on the issuer and policy does not require re-prompting, the issuer should complete a new authorization request for another registered browser client without asking for credentials again.

This keeps reuse where it belongs: in the issuer session, not in a shared callback endpoint.

### 6. Backend-assisted token exchange remains allowed, but custody stays with the client that owns the callback

The existing first-party pattern keeps the access token in FE memory and the refresh token in a backend-managed `httpOnly` cookie. That pattern can continue, but it belongs to the client application that owns the registered callback URI and refresh cookie path. This slice should not assume that some other host can receive the code, exchange it, and impersonate callback ownership for every browser app.

For the hosted Identity admin shell, that means the existing backend-assisted exchange can remain, but its authorize request and callback URI must still follow the explicit issuer/client registration contract.

## Risks / Trade-offs

- [Configuration becomes more explicit] -> Accept the extra configuration because exact redirect contracts are safer than inferred origin behavior.
- [Current hosted login UX and client auth-start logic are tightly coupled] -> Split the responsibilities carefully: issuer-hosted credential entry stays in Identity, while auth-start logic uses issuer/client settings rather than current-origin assumptions.
- [Additional browser clients may need their own backend-assisted exchange or direct token handling] -> Keep this slice focused on the issuer contract and hosted Identity client; downstream client adoption can follow once the contract is stable.
- [Logout and post-logout redirect behavior can lag behind login changes] -> Treat post-logout redirect support as part of the registration model and verify it explicitly before rollout.

## Migration Plan

1. Update the authentication OpenSpec to define issuer-hosted login plus client-owned exact callback URIs.
2. Replace the narrow single-client redirect-uri assumption with an explicit browser-client registration model.
3. Refactor the hosted Identity auth shell so it starts OIDC against the configured issuer and uses a configured registered callback URI.
4. Validate exact redirect-uri matching, rejection of unregistered redirects, and hosted-session reuse across at least two registered browser clients.
5. Document how downstream browser apps should register their redirect URIs with the shared issuer.

Rollback can restore the single-client same-origin assumptions, but doing so would preserve the current scaling constraint for additional browser apps.

## Open Questions

- Should the first implementation support multiple redirect URIs per browser client immediately, or only one callback URI per client with multi-URI support in a follow-up?
- Should post-logout redirect URIs ship in this slice or be staged immediately after login/callback support lands?
