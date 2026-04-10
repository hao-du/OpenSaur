## Context

Umbraco is already wired to authenticate through the Identity issuer with ASP.NET Core OpenID Connect. The OIDC middleware builds `redirect_uri` values from the current request scheme, host, path base, and callback path. To move the application under `/cms`, the clean design is to set an ASP.NET Core path base instead of hardcoding `/cms` into individual callback paths.

## Decisions

### 1. Introduce a configurable app base path

Add `OpenSaurIdentityBackOffice:AppBasePath` with `/cms` as the configured value. The option model normalizes this value so empty or `/` can still represent root-hosted deployments later.

### 2. Apply ASP.NET Core `UsePathBase(...)` before the Umbraco pipeline

Mount the application under the configured path base in `Program.cs` before `UseUmbraco()`. This keeps all downstream routing, generated links, and OpenID Connect callback construction aligned on one base path.

### 3. Keep callback and logout paths relative to the app root

Keep:

- `CallbackPath = /signin-oidc`
- `SignedOutCallbackPath = /signout-callback-oidc`

With `PathBase=/cms`, ASP.NET Core OIDC will generate:

- `/cms/signin-oidc`
- `/cms/signout-callback-oidc`

This avoids duplicating the base path in multiple settings.

### 4. Update launch profiles to open the backoffice under `/cms/umbraco`

Local developer startup should land on the mounted backoffice route so the app behaves consistently with the new hosting model.

## Risks / Trade-offs

- Existing bookmarks or hardcoded local URLs pointing at `/umbraco` will no longer be valid.
- The Identity issuer must register the exact callback and logout URIs under `/cms`, or OIDC will reject the request.

## Verification

- Build the Umbraco project.
- Start the app and verify `https://localhost:5321/cms/umbraco` responds.
- Verify the authorize request now uses `redirect_uri=https://localhost:5321/cms/signin-oidc`.
