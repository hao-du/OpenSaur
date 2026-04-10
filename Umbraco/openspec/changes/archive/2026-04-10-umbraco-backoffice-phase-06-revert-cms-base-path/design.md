## Context

The current Umbraco app uses `ApplicationVirtualPath = /cms`, `UsePathBase("/cms")`, redirect shims, and mounted-asset compatibility rewriting to host the backoffice under `/cms/umbraco`. The requested behavior is to undo that mount and return to the default root-hosted Umbraco route shape while keeping the OpenID Connect external login integration in place.

## Decisions

### 1. Remove the mounted app base path

Set the Umbraco app back to root hosting by removing the `/cms` application virtual path and by not applying `UsePathBase(...)` in `Program.cs`.

### 2. Keep callback and logout paths relative to the app root

Keep:

- `CallbackPath = /signin-oidc`
- `SignedOutCallbackPath = /signout-callback-oidc`

With no application path base, ASP.NET Core OIDC will generate:

- `/signin-oidc`
- `/signout-callback-oidc`

### 3. Remove mounted-path compatibility middleware

Delete the redirect shim, the mounted backoffice-path HTML injection, and the fingerprinted backoffice asset rewrite because those only exist to make `/cms` work.

### 4. Restore local startup to the root backoffice URL

Update launch settings so local startup opens `/umbraco`.

## Risks / Trade-offs

- Existing `/cms/...` bookmarks will stop working after this revert.
- The Identity issuer must allow the reverted callback/logout URIs without the `/cms` prefix.

## Verification

- Build the Umbraco project.
- Start the app and verify `http://localhost:5320/umbraco` returns the backoffice shell.
- Verify the generated backoffice HTML no longer contains the `/cms` base path.
- Verify root backoffice CSS and JS asset URLs return `200`.
