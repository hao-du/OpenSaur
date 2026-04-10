## Why

The temporary `/cms` application mount complicates local Umbraco backoffice hosting and OIDC callback handling. The requested behavior is to return the app to the default root-hosted backoffice shape so the backoffice is reached at `/umbraco` and the external OIDC callback/logout routes return to `/signin-oidc` and `/signout-callback-oidc`.

## What Changes

- Remove the configurable `/cms` application mount from the ASP.NET Core and Umbraco pipeline.
- Restore the default root-hosted backoffice entry route.
- Restore the default root-level OIDC callback and signed-out callback route shape.
- Remove the compatibility shims that only exist to support the mounted `/cms` path.

## Capabilities

### Modified Capabilities
- `backoffice-oidc-authentication`: the Umbraco backoffice is hosted at the application root instead of under `/cms`.

## Impact

- Affected code in `src/OpenSaur.Umbraco.Web/Program.cs`, `src/OpenSaur.Umbraco.Web/Authentication/`, and configuration files.
- Changes the local backoffice URL from `/cms/umbraco` back to `/umbraco`.
- Changes the expected Identity issuer callback/logout URIs from `/cms/signin-oidc` and `/cms/signout-callback-oidc` back to `/signin-oidc` and `/signout-callback-oidc`.
