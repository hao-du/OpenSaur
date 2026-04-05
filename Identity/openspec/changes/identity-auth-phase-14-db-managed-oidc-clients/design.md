# Design

## Overview

The issuer remains the source of truth for OpenIddict applications, but the app no longer treats appsettings as the long-term source of truth for each browser client's full redirect URI list.

Instead:

1. `Oidc.BootstrapClient` seeds the initial shell client when the database has no managed client records.
2. `Oidc.CurrentClient` identifies which managed client belongs to the current deployment at runtime.
3. Managed OIDC clients are stored in application tables:
   - `OidcClients`
   - `OidcClientOrigins`
4. Each managed client stores:
   - `ClientId`
   - `ClientSecret`
   - `DisplayName`
   - `Description`
   - `Scope`
   - `AppPathBase`
   - `CallbackPath`
   - `PostLogoutPath`
   - active public origins
5. Exact redirect and post-logout URIs are derived at runtime and during OpenIddict synchronization by combining:
   - origin root from DB
   - app path base from DB
   - client-owned callback and post-logout paths from DB

This keeps the callback/login path rules centralized while letting operators manage actual hosts in data.

## Data Model

Managed client:

- one row per logical browser client
- unique `ClientId`
- active/inactive lifecycle

Managed origins:

- one row per public origin root
- stored without path segments
- unique per `(OidcClientId, BaseUri)`

The app path base belongs to the client, not to the origin, because the same logical app usually shares one path base across its allowed hosts.

## URI Composition

Bootstrap defaults for first seed only:

```json
"Oidc": {
  "BootstrapClient": {
    "CallbackPath": "/auth/callback",
    "PostLogoutPath": "/login"
  }
}
```

Managed client data example:

```json
{
  "AppPathBase": "/identity",
  "CallbackPath": "/auth/callback",
  "Origins": [
    "https://app.example.com/",
    "http://localhost:5220/"
  ],
  "PostLogoutPath": "/login"
}
```

Derived URIs:

- `https://app.example.com/identity/auth/callback`
- `http://localhost:5220/identity/auth/callback`
- `https://app.example.com/identity/login`
- `http://localhost:5220/identity/login`

This keeps the DB payload smaller and avoids repeating callback/login suffixes across every origin.
It also allows different client types such as shell-style clients and framework-owned clients like Umbraco to use different callback conventions under the same issuer.

## Runtime Resolution

The runtime shell config and backend token exchange paths resolve the current managed client from:

- `Oidc.CurrentClient.ClientId`
- `Oidc.CurrentClient.ClientSecret`

Then they validate that the current host or callback URI belongs to that managed client by checking:

- normalized public origin root
- normalized app path base

This allows:

- hosted issuer shell mode
- localhost shell mode
- future same-domain different-path clients

without hardcoding a single shared callback list into the frontend bundle.

## Synchronization

Managed clients are synchronized into OpenIddict applications:

- active managed client -> create or update matching OpenIddict application
- inactive managed client -> remove matching OpenIddict application

Synchronization happens:

- at startup
- after create
- after edit
- after deactivation

## Admin Surface

Only super administrators may manage OIDC clients.

Backend:

- secured `/api/oidc-client/*` endpoints
- create, read, update, and deactivate operations

Frontend:

- protected `/oidc-clients` route
- visible only to super administrators
- shows managed origins plus derived redirect URIs

Deactivation is implemented as a soft delete to preserve audit history while removing the client from active issuer registration.

## Security Notes

- redirect URIs remain exact and derived deterministically
- origins must be absolute and pathless
- no wildcard redirect URI behavior is introduced
- the current admin shell client cannot be deactivated from its own host
- runtime config still exposes only browser-safe client metadata, never the deployment secret used to identify the current managed client
- changing the current managed client's secret in the admin UI requires the matching `Oidc.CurrentClient` deployment secret to be updated for that deployment as well
