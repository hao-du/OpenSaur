## Why

Local Umbraco development currently forces HTTP traffic onto HTTPS. The requested development behavior is to allow both local schemes to work so developers can access `/cms/umbraco` over either `http://localhost:5320` or `https://localhost:5321` without an automatic scheme redirect.

## What Changes

- Remove forced HTTPS redirection from the Umbraco app pipeline.
- Keep the existing `/cms` base-path hosting model intact.
- Preserve backoffice and OIDC route behavior while allowing both local schemes.

## Capabilities

### Modified Capabilities
- `backoffice-oidc-authentication`: allow local development access over both HTTP and HTTPS without a forced scheme redirect.

## Impact

- Affected code in `src/OpenSaur.Umbraco.Web/Program.cs`.
- Changes local behavior only; it does not change the configured issuer authority or OIDC callback paths.
