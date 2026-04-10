## Why

The Umbraco app currently assumes it is mounted at the host root, so its backoffice login flow generates root-level callback URIs like `/signin-oidc`. The requested hosting model moves the application under `/cms`, which means the backoffice route and the OIDC callback/logout routes must all include that base path consistently.

## What Changes

- Add a configurable application base path for the Umbraco app.
- Mount the ASP.NET Core and Umbraco pipeline under `/cms`.
- Ensure OIDC callback and signed-out callback URIs inherit the configured app base path.
- Update local launch settings so the development profile opens the backoffice under `/cms/umbraco`.

## Capabilities

### Modified Capabilities
- `backoffice-oidc-authentication`: support a configurable application base path for Umbraco backoffice routes and OIDC infrastructure endpoints.

## Impact

- Affected code in `src/OpenSaur.Umbraco.Web/Program.cs`, `src/OpenSaur.Umbraco.Web/Authentication/`, and app configuration.
- Changes the local backoffice URL from `/umbraco` to `/cms/umbraco`.
- Requires the Identity issuer client registration to allow callback/logout URIs under the `/cms` prefix.
