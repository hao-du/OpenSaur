# Identity Client Integration

This document describes the current integration contract for apps that authenticate through the shared Identity issuer.

For the exact browser flow used by the current React shell, see `docs/identity-login-flows.md`.

The important rule is:

- the exact configured `Oidc:Issuer` base URI is the issuer
- every other host or path base is a client, even on the same domain
- callback ownership belongs to the app that registered the exact redirect URI

Examples:

- `https://<issuer-host>/<issuer-app-base>` with `Oidc:Issuer = https://<issuer-host>/<issuer-app-base>` is the issuer
- `https://<issuer-host>/<other-app-base>` is a client
- `http://localhost:<port>/<app-base>` is a client
- `https://<client-host>` is a client

## Integration Modes

| Client category | Example only | Who owns the callback? | Session after callback |
|---|---|---|---|
| Issuer-hosted shell | `https://<issuer-host>/<issuer-app-base>` | the issuer host | ASP.NET Identity cookie on the issuer |
| First-party SPA client | `http://localhost:<port>/<app-base>` | the SPA's own host and callback route | access token in memory plus refresh token in a host-owned `HttpOnly` cookie |
| Server-rendered or backend-managed web client | `https://<client-host>` | the backend or framework callback route | app-owned server session or middleware-managed tokens |

Important boundary:

- the issuer owns `/connect/authorize`, `/connect/token`, login UI, and redirect-uri validation
- each client owns its own callback URI, final return route, and post-callback local session behavior

## Main Code Paths

Frontend shell integration points:

- runtime auth config: `src/OpenSaur.Identity.Web/client/src/shared/config/env.ts`
- authorize URL and hosted-mode detection: `src/OpenSaur.Identity.Web/client/src/features/auth/utils/firstPartyOidc.ts`
- callback completion page: `src/OpenSaur.Identity.Web/client/src/pages/auth-callback/AuthCallbackPage.tsx`
- managed-client admin page: `src/OpenSaur.Identity.Web/client/src/pages/oidc-clients/OidcClientsPage.tsx`
- managed-client API calls: `src/OpenSaur.Identity.Web/client/src/features/oidc-clients/api/oidcClientsApi.ts`

Backend integration points:

- pipeline and route mapping: `src/OpenSaur.Identity.Web/Program.cs`
- runtime config and hosted shell routes: `src/OpenSaur.Identity.Web/Infrastructure/Hosting/FrontendAppRoutes.cs`
- OIDC configuration model: `src/OpenSaur.Identity.Web/Infrastructure/Oidc/OidcOptions.cs`
- issuer/current-app URI helpers: `src/OpenSaur.Identity.Web/Infrastructure/Oidc/OidcOptionsExtensions.cs`
- managed-client lookup and URI composition: `src/OpenSaur.Identity.Web/Infrastructure/Oidc/ManagedOidcClientResolver.cs`
- managed-client to OpenIddict synchronization: `src/OpenSaur.Identity.Web/Infrastructure/Oidc/ManagedOidcClientSynchronizer.cs`
- issuer authorize endpoint: `src/OpenSaur.Identity.Web/Features/Auth/Oidc/OidcEndpoints.cs`
- SPA callback code exchange: `src/OpenSaur.Identity.Web/Features/Auth/WebSession/ExchangeWebSessionHandler.cs`
- SPA refresh-token rotation: `src/OpenSaur.Identity.Web/Features/Auth/WebSession/RefreshWebSessionHandler.cs`
- managed-client admin endpoints: `src/OpenSaur.Identity.Web/Features/OidcClients/OidcClientEndpoints.cs`
- JWT and hosted-cookie claim projection: `src/OpenSaur.Identity.Web/Features/Auth/AuthSessionPrincipalFactory.cs`, `src/OpenSaur.Identity.Web/Infrastructure/Security/IdentitySessionClaimsTransformation.cs`

## Current Managed Client Model

The current Identity issuer now treats first-party browser clients as managed data, not as hardcoded frontend constants.

Configuration roles:

- `Oidc.BootstrapClient` is only a bootstrap seed used when the OIDC client tables are empty
- `Oidc.CurrentClient` identifies which managed client record belongs to the current deployment
- the database stores the durable client metadata that OpenIddict actually uses

Managed client fields:

- `ClientId`
- `ClientSecret`
- `DisplayName`
- `Description`
- `Scope`
- `AppPathBase`
- `CallbackPath`
- `PostLogoutPath`
- active public origin roots such as `https://app.example.com/` or `http://localhost:5220/`

Derived runtime values:

- redirect URI = `origin + app path base + callback path`
- post-logout redirect URI = `origin + app path base + post-logout path`

## Runtime Bootstrap Flow

### 1. The backend serves runtime auth settings from the current host

Code locations:

- `Program.cs`
- `FrontendAppRoutes.cs`
- `OidcOptionsExtensions.cs`

What happens:

1. `Program.cs` maps `/identity/app-config.js` through `app.MapShellRuntimeConfig()`.
2. `FrontendAppRoutes.ServeRuntimeConfigAsync(...)` resolves the current browser-visible base URI with `OidcOptionsExtensions.GetCurrentAppBaseUri(...)`.
3. The same handler resolves the active managed client with `ManagedOidcClientResolver.ResolveCurrentClientAsync(...)`.
4. The response includes:
   - issuer
   - current client id
   - resolved redirect URI
   - scope
   - `isIssuerHostedApp`
   - Google reCAPTCHA v3 public settings when configured
5. The runtime config and hosted shell HTML both send `no-store` headers so stale callback settings are not cached across deployments.

### 2. The frontend reads runtime config before choosing the auth flow

Code locations:

- `src/OpenSaur.Identity.Web/client/src/shared/config/env.ts`
- `src/OpenSaur.Identity.Web/client/src/features/auth/utils/firstPartyOidc.ts`

What happens:

1. `env.ts` reads `window.__OPENSAUR_IDENTITY_CONFIG__`.
2. `firstPartyOidc.ts` uses that runtime config to:
   - decide whether the current host is issuer-hosted
   - build the `/connect/authorize` URL
   - preserve and restore the return route through the encoded `state`
3. This keeps hosted, localhost, and future path-base deployments on the same frontend bundle without hardcoding one environment's issuer hostname into another build.

### 3. A non-issuer SPA completes callback exchange on its own host

Code locations:

- `AuthCallbackPage.tsx`
- `ExchangeWebSessionHandler.cs`
- `RefreshWebSessionHandler.cs`
- `ManagedOidcClientResolver.cs`

What happens:

1. `AuthCallbackPage.tsx` reads the authorization `code` from the client-owned callback route.
2. The page posts that code to `/api/auth/web-session/exchange` on the same host.
3. `ExchangeWebSessionHandler` rebuilds the current deployment's exact redirect URI from the managed client record before calling `/connect/token`.
4. `RefreshWebSessionHandler` uses the same managed redirect URI when it refreshes access tokens later.
5. The client host stores the refresh token in its own `HttpOnly` cookie and keeps the access token in memory only.

## Redirect Ownership And Validation

Exact redirect validation is enforced in two places.

Code locations:

- `ManagedOidcClientResolver.cs`
- `ManagedOidcClientSynchronizer.cs`
- `OidcClientEndpoints.cs`
- `OidcClientsPage.tsx`

What happens:

1. `ManagedOidcClientResolver` validates the current deployment by matching all of these together:
   - `Oidc.CurrentClient.ClientId`
   - `Oidc.CurrentClient.ClientSecret`
   - current public origin root
   - current app path base
2. If that match fails, the app cannot resolve a valid redirect URI for the current host.
3. `ManagedOidcClientSynchronizer` writes the derived redirect URIs and post-logout redirect URIs into the OpenIddict application record.
4. If a managed client is deactivated, the synchronizer deletes its active OpenIddict application registration so it can no longer start new authorization flows.
5. Super administrators manage those records through `/api/oidc-client/*` and the `/oidc-clients` shell page.

Important rule:

- never trust origin alone
- never use wildcard redirect URIs
- never assume same-domain means issuer
- preserve the final client route in `state` or client-owned return-url storage

## Permission And Role Claims For Downstream Clients

Downstream clients should prefer the issuer's token claims over direct Identity database reads.

Code locations:

- `OidcEndpoints.cs`
- `AuthSessionPrincipalFactory.cs`
- `PermissionAuthorizationService.cs`
- `IdentitySessionClaimsTransformation.cs`

Current claim contract:

- repeated `roles` claims when the `roles` scope is granted
- repeated `permissions` claims when the `api` scope is granted
- permission values use canonical strings such as `Administrator.CanManage`
- the claim set respects the effective workspace and impersonation context

Important nuance:

- JWT access tokens get permission claims from `AuthSessionPrincipalFactory`
- issuer-hosted cookie sessions get the same effective roles and permissions through `IdentitySessionClaimsTransformation`

That keeps hosted cookie mode and bearer-token mode aligned on the same authorization model.

## Deployment Checklist

For a healthy client integration:

- set `Oidc:Issuer` to the public issuer base URI
- set `Oidc:CurrentAppBaseUri` when proxies, tunnels, gateways, or CDNs can hide the browser-visible host
- keep `Oidc.CurrentClient` aligned with one active managed OIDC client record
- make sure the managed client's origin roots, app path base, callback path, and post-logout path match the real deployment
- do not cache `/identity/app-config.js` or the hosted shell entry HTML at the edge
- preserve and restore routes inside the client's own app base
- if the client is server-rendered or middleware-managed, let that app own its own callback route instead of reusing the SPA `/api/auth/web-session/exchange` helper
