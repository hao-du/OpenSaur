# Identity Client Integration

This document defines the integration contract for apps that authenticate through the shared issuer.

The contract is generic. Product names such as `contentwriter`, `cms`, or `registers` are only examples of client shapes, not hardcoded app definitions.

## Core Rule

There is one source of trust:

- issuer: the exact configured `Oidc:Issuer`

Everything else is a client:

- different host: client
- same host but different path base: client
- same domain but different subdomain: client

The issuer is determined by exact base URI, not by "same domain".

Examples:

- `https://<issuer-host>/<issuer-app-base>` with `Oidc:Issuer = https://<issuer-host>/<issuer-app-base>` -> issuer
- `https://<issuer-host>/<other-app-base>` -> client
- `http://localhost:<port>/<app-base>` -> client
- `https://<client-host>` -> client

## Client Categories

### 1. Issuer-hosted shell

Use this only when the app is running on the exact issuer base URI.

Behavior:

- login page is hosted on the issuer
- authenticated bootstrap uses the issuer ASP.NET Identity cookie directly
- no self-`/connect/authorize`
- no self-`/connect/token`
- no backend-assisted callback exchange for ordinary sign-in
- return target is the preserved issuer route

Current example:

- `https://<issuer-host>/<issuer-app-base>`

### 2. First-party SPA client

Use this for a JavaScript SPA running on any non-issuer host or path base.

Behavior:

- browser redirects to the issuer for login
- issuer returns to the client's exact registered callback URI
- client may use backend-assisted callback exchange if it follows the same shell pattern as Identity
- client keeps access token in memory only
- client keeps refresh token in a host-owned `HttpOnly` cookie
- return target is the preserved client route

Examples:

- `http://localhost:<port>/<app-base>`
- `http://localhost:5420/<app>`
- `https://<issuer-host>/<other-app-base>`

### 3. Server-rendered or backend-managed web client

Use this for apps such as MVC, Razor Pages, Umbraco, or other server-owned web flows.

Behavior:

- browser redirects to the issuer for login
- issuer returns to the backend-owned callback URI
- the backend or framework middleware completes the OIDC code flow
- the app manages its own authenticated session after callback
- return target is the preserved backend route

Examples:

- `http://localhost:5600/<backend-app>`
- `https://<issuer-host>/<backend-app>`
- `https://<client-host>`

## Redirect URI Contract

Every client must use exact registered redirect URIs.

Required registration fields:

- `client_id`
- `client_secret` when confidential
- exact `redirect_uri` list
- exact post-logout redirect URI list if logout redirection is needed
- scopes

Rules:

- never derive trust from origin alone
- never accept wildcard redirect URIs
- never share one callback URI across unrelated apps through custom brokering
- preserve the client's final route in state or app-managed return-url storage

Generic examples:

- SPA callback: `<scheme>://<host>/<app-base>/auth/callback`
- backend callback: `<scheme>://<host>/<backend-base>/signin-oidc` or framework equivalent

## Return URL Contract

Do not hardcode product routes into the shared auth model.

Use this rule:

- anonymous user requests protected route
- client preserves that exact route as the post-login target
- login flow returns to the client callback or hosted route
- client restores the preserved route after authentication completes

Only use a default landing route when there is no prior requested route.

For the current Identity shell:

- default protected landing route remains `/identity/`

## Recommended Long-Term Client Model

To keep the system maintainable:

- one issuer: `https://<issuer-host>/<issuer-app-base>`
- one client contract per real app, not per example URL
- use a shared first-party client only when multiple hosts are truly the same shell with the same permissions and callback behavior
- use separate client registrations when apps diverge in permissions, lifecycle, or framework behavior

Practical recommendation:

- Identity shell across hosted and localhost: can stay one shared client if it remains the same app
- future apps such as writer, registers, or CMS-style backends: give them their own client registrations

That keeps the logic simple:

- issuer host reuses issuer cookie directly
- every other app is just a normal client of that issuer

## Clean Implementation Boundary

The shared auth platform should own:

- issuer login UI
- issuer session cookie
- `/connect/authorize`
- `/connect/token`
- redirect URI validation

Each client should own:

- its own callback URI
- its own final return route
- its own local session strategy after callback
- its own logout UX

This keeps the platform stable while allowing different app types to integrate cleanly.

## Runtime Configuration Boundary

Clients that reuse this shell code should not bake issuer hostnames or callback assumptions into a static frontend bundle.

Use this rule:

- backend configuration remains the source of truth for `Oidc:Issuer`, client id, scopes, and allowed redirect URIs
- the shell receives those auth settings from the current host at runtime
- the shell derives only the current protected return route in the browser

For the current Identity shell, the backend serves a runtime bootstrap script for the frontend. That keeps hosted and localhost deployments on the same codebase without hardcoding one deployment's issuer hostname into another deployment's frontend build.

If a deployment sits behind reverse proxies, tunnels, or gateways that may not preserve the browser-visible host reliably, configure the current app's public base URI explicitly. The shell should generate callback URIs and issuer-hosted-mode detection from that configured public base URI, not from an internal proxy hostname.

That runtime bootstrap and the hosted shell entry HTML must not be edge-cached. CDNs, tunnels, and reverse proxies should bypass cache for those responses or honor `no-store` headers so stale `redirectUri`, issuer-hosted-mode, or app-base routing values are not replayed after deployment changes.

When a client runs under a path base, preserve and restore routes within that app base. A hosted shell mounted at `/identity` should return to `/identity/` or `/identity/...`, not to the domain root.
