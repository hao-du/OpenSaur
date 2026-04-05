## Context

The current Identity browser flow is intentionally same-host:

- the hosted login page posts credentials to `/api/auth/login` on the current host
- the frontend then starts OIDC authorization from the current origin
- the frontend selects its callback URI from the current host without an explicit server-side registration contract
- impersonation mutates the local session and mints replacement tokens without going back through the issuer
- backend configuration only modeled one narrow `Oidc:FirstPartyWeb` callback assumption

That shape is convenient for the current Identity-hosted SPA, but it couples login UX and redirect handling to whichever app the user is visiting. As soon as another browser app on a different origin needs to authenticate, the current approach either forces that app to host its own credential-entry experience or pushes us toward a custom shared-callback broker.

The preferred architecture is the standard OIDC model:

- the issuer owns credential entry and the hosted authentication session
- the shared first-party shell client owns one or more exact registered callback URIs on the origins where that shell runs
- the issuer can reuse its hosted session across those registered callback URIs
- impersonation changes the issuer-hosted session first, then returns the browser through the same authorization-code flow as normal login

## Goals / Non-Goals

**Goals:**

- Move browser credential entry to the issuer configured by `Oidc:Issuer`.
- Require exact registered redirect URIs instead of unvalidated origin-derived callbacks.
- Preserve hosted SSO across registered callback URIs when the issuer session is still valid.
- Keep the current backend-assisted refresh-cookie pattern available for first-party browser clients that want it.
- Remove the impersonation-only local token-issuance shortcut.

**Non-Goals:**

- A shared callback endpoint such as one `/auth/callback` that all browser apps use through custom brokering.
- Replacing OpenIddict or moving away from authorization code flow.
- Designing mobile/native client behavior in this slice.
- Building every downstream browser app that will eventually consume this model.
- Reworking non-auth admin screens beyond the auth-start/callback boundary needed for this slice.

## Decisions

### 1. The shared first-party client owns exact callback URIs on each supported origin

The shared first-party shell will be treated as one OIDC client with multiple exact registered redirect URI(s), one per supported browser origin. The issuer will redirect the browser only to a callback URI registered for that first-party client, and authorization requests with an unregistered redirect URI will be rejected.

This keeps the solution aligned with standard OAuth/OIDC redirect-uri matching instead of introducing a central callback broker.

Alternatives considered:

- One shared callback on the issuer domain for every browser app: rejected because it turns the issuer into a custom callback broker and increases cross-app coupling.
- Separate client identifiers for `localhost` and the hosted shell: deferred because both hosts are the same first-party app in this slice and do not need separate permissions.
- Blindly derive callback URI from `window.location.origin`: rejected because it is convenient only for same-host setups and does not produce an explicit registration contract.

### 2. The issuer owns browser credential entry and hosted sign-in UX

Browser apps should not need to host their own credential-entry experience just to authenticate through the shared issuer. If a browser app starts an authorization request without an existing hosted session, the user should be sent to the issuer-hosted login UI on the issuer domain. Once authenticated, the issuer redirects back to the requesting client's registered callback URI.

The current login API can remain part of the issuer-hosted login experience, but it should no longer be the browser-login entry point for unrelated app hosts.

### 3. First-party client registration becomes explicit

The current `Oidc:FirstPartyWeb` options shape is too narrow because it assumes one callback URI and one callback ownership model. This slice should move to an explicit first-party client registration model that represents:

- client identifier
- exact redirect URI(s)
- exact post-logout redirect URI(s) when supported in the same slice
- scopes/permissions needed by that client

The initial implementation stays configuration-driven; moving client registration to an admin-managed data model can remain a later change.

### 4. The hosted first-party auth shell uses the configured issuer and a registered callback URI for the current host

The current hosted frontend must always send authorization requests to the configured issuer. The callback URI may still be selected from the current host, but only as the candidate callback for the shared first-party client, and the backend must reject any callback URI that is not explicitly registered.

- the configured issuer authority
- the current host's exact registered redirect URI
- the existing client id/scope settings

This removes the hidden assumption that the current browser host also owns issuer authority or can use arbitrary callback values.

### 5. Hosted SSO remains session-based at the issuer, not callback-based

Hosted SSO should continue to come from the issuer's hosted authentication session. If the user has already authenticated on the issuer and policy does not require re-prompting, the issuer should complete a new authorization request for another registered callback URI without asking for credentials again.

This keeps reuse where it belongs: in the issuer session, not in a shared callback endpoint.

### 6. Backend-assisted token exchange remains allowed, but custody stays with the host that owns the callback

The existing first-party pattern keeps the access token in FE memory and the refresh token in a backend-managed `httpOnly` cookie. That pattern can continue, but it belongs to the client application that owns the registered callback URI and refresh cookie path. This slice should not assume that some other host can receive the code, exchange it, and impersonate callback ownership for every browser app.

For the hosted Identity admin shell, that means the existing backend-assisted exchange can remain, but its authorize request and callback URI must still follow the explicit issuer/client registration contract.

### 7. Impersonation becomes an issuer-hosted browser round-trip

Starting or exiting impersonation must update the issuer-hosted authentication session first, then send the browser through the normal `/connect/authorize` and callback flow for the requesting host. The local app must not mint replacement access/refresh tokens directly from impersonation endpoints.

This keeps session mutation in the same trust boundary as normal sign-in and removes the last local-only token issuance shortcut from the first-party flow.

## Risks / Trade-offs

- [Configuration becomes more explicit] -> Accept the extra configuration because exact redirect contracts are safer than inferred origin behavior.
- [Current hosted login UX and auth-start logic are tightly coupled] -> Split the responsibilities carefully: issuer-hosted credential entry stays in Identity, while auth-start logic uses configured issuer authority plus exact registered callback URIs.
- [Impersonation now depends on a full browser round-trip] -> Accept the extra redirect because it keeps issuer session mutation and token issuance in one trust boundary.
- [Logout and post-logout redirect behavior can lag behind login changes] -> Treat post-logout redirect support as part of the registration model and verify it explicitly before rollout.

## Migration Plan

1. Update the authentication OpenSpec to define issuer-hosted login plus client-owned exact callback URIs.
2. Replace the narrow callback assumption with explicit first-party client registration that lists exact callback URIs.
3. Refactor the hosted Identity auth shell so it starts OIDC against the configured issuer and uses an exact registered callback URI for the current host.
4. Move impersonation start and exit to issuer-hosted browser round-trips.
5. Validate exact redirect-uri matching, rejection of unregistered redirects, and hosted-session reuse across at least two registered callback URIs.
6. Document how downstream first-party hosts should register their callback URIs with the shared issuer.

Rollback can restore the single-client same-origin assumptions, but doing so would preserve the current scaling constraint for additional browser apps.

## Open Questions

- Should the first-party client remain a single shared client across all first-party shell hosts long-term, or split into multiple client identifiers later when permissions diverge?
- Should post-logout redirect URIs stay in the same shared first-party client registration or move to per-host configuration later?
