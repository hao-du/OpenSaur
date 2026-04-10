## Why

The deployed Identity service can publish OIDC discovery endpoint URLs using the Azure Container Apps gateway host even when `Oidc:Issuer` is configured as the public issuer URL. OIDC clients such as Umbraco then follow the gateway authorization endpoint instead of the public `app.duchihao.com` authority.

## What Changes

- Keep OpenIddict endpoint route registration relative so the server continues to match `/identity/connect/*` behind a reverse proxy.
- Rewrite OIDC discovery metadata endpoints to the configured public issuer base URI.
- Preserve token issuance, redirect URI validation, and managed OIDC client registration behavior.

## Capabilities

### Modified Capabilities

- `identity-authentication`: OIDC discovery advertises public issuer-owned endpoint URLs for authorization, token, logout, and JWKS metadata.

## Impact

- OpenIddict server registration in `src/OpenSaur.Identity.Web/Infrastructure/DependencyInjection.cs`.
- No database migration is required.
