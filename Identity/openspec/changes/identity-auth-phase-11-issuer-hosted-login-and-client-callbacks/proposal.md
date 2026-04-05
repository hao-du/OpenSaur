## Why

The current hosted browser flow in `OpenSaur.Identity.Web` assumes the app that starts authentication also collects credentials locally and can derive its effective callback behavior from the current browser origin. That works for the current same-host identity app, but it does not scale cleanly when the trusted issuer host and the consuming browser host are different.

Standard OIDC usage is cleaner: the issuer owns the hosted login experience and browser session, while the consuming first-party app owns an exact registered callback URI on its own host. We also need impersonation to follow that same issuer-owned session model instead of mutating local tokens directly.

## What Changes

- Move browser credential-entry responsibility to the issuer configured by `Oidc:Issuer` instead of assuming each app collects credentials on its own host.
- Replace the current single `Oidc:FirstPartyWeb` callback assumption with an explicit first-party client configuration that allows multiple exact registered redirect URI(s) and post-logout redirect URI(s).
- Update the hosted first-party auth shell so non-issuer hosts use OIDC authorization against the configured issuer while the issuer host itself reuses its local ASP.NET Identity cookie directly instead of running `/connect/authorize` against itself.
- Serve issuer/client runtime auth settings from the backend so the frontend shell does not hardcode deployment-specific issuer hostnames or callback defaults at build time.
- Document the client categories explicitly so future SPA, same-origin different-path, subdomain, and backend-managed apps all follow the same issuer/client contract instead of host-specific one-off rules.
- Preserve hosted SSO across registered callback URIs by reusing the issuer session when policy allows.
- Route impersonation start and exit through issuer-hosted browser round-trips so the issuer remains the only source of truth for session mutation.
- Keep issuer-handoff, callback, and exchange-failure UI states localized from the current host's cached preferences, and sync authenticated user settings back into that host after callback completion.
- Keep the solution standards-based: no shared broker callback for all apps, and no custom non-OIDC browser-login protocol.

## Capabilities

### Modified Capabilities
- `identity-authentication`: Browser authentication moves to an issuer-hosted login model with exact registered first-party callback URIs, hosted-session reuse across those callback URIs, direct issuer-cookie reuse on the issuer host, and issuer-hosted impersonation round-trips.
- `identity-fe-auth-shell`: The hosted auth shell targets the configured issuer for non-issuer hosts, reuses the local issuer cookie directly when it is running on the issuer host, treats impersonation as a full issuer/browser redirect flow instead of an in-place token swap, and keeps issuer-handoff states localized from the current host's preference cache.

## Impact

- Affected backend code spans OIDC configuration, client registration, and first-party token-exchange assumptions in `src/OpenSaur.Identity.Web/**`.
- Affected frontend code spans auth-start, callback, return-url, and logout orchestration in `src/OpenSaur.Identity.Web/client/**`.
- Additional verification is needed for exact redirect-uri matching, rejection of unregistered redirect URIs, and hosted-session reuse across more than one registered callback URI.
