## Why

The current hosted browser flow in `OpenSaur.Identity.Web` assumes the app that starts authentication also collects credentials locally and can derive its OIDC callback from the current browser origin. That works for the current same-host identity app, but it does not scale cleanly to multiple browser apps on different origins.

Standard OIDC usage is cleaner: the issuer owns the hosted login experience and browser session, while each client app owns its own exact registered callback URI. We need to move the current identity slice toward that model before more apps depend on the current same-origin assumptions.

## What Changes

- Move browser credential-entry responsibility to the issuer configured by `Oidc:Issuer` instead of assuming each app collects credentials on its own host.
- Require each browser client to use its own exact registered redirect URI(s) and optional post-logout redirect URI(s) instead of deriving them from `window.location.origin`.
- Replace the current single `Oidc:FirstPartyWeb` redirect-uri assumption with a browser-client registration model that can represent multiple web clients.
- Update the hosted first-party auth shell so OIDC authorization requests target the configured issuer and use the registered callback URI for that client.
- Preserve hosted SSO across registered browser clients by reusing the identity-server session when policy allows.
- Keep the solution standards-based: no shared broker callback for all apps, and no custom non-OIDC browser-login protocol.

## Capabilities

### Modified Capabilities
- `identity-authentication`: Browser authentication moves to an issuer-hosted login model with client-owned exact redirect URIs and hosted-session reuse across registered browser clients.
- `identity-fe-auth-shell`: The hosted auth shell stops deriving its redirect URI from the current browser origin and instead uses configured issuer/client registration settings.

## Impact

- Affected backend code spans OIDC configuration, client registration, and first-party token-exchange assumptions in `src/OpenSaur.Identity.Web/**`.
- Affected frontend code spans auth-start, callback, return-url, and logout orchestration in `src/OpenSaur.Identity.Web/client/**`.
- Additional verification is needed for exact redirect-uri matching, rejection of unregistered redirect URIs, and hosted-session reuse across more than one browser client.
