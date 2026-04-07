## Why

The mounted `/cms/umbraco` backoffice entry page currently returns HTML, but its CSS and JavaScript assets fail with 404 responses. The result is a blank backoffice shell. This happens because the mounted path, the backoffice frontend path, and the static asset route handling are not aligned.

## What Changes

- Stop redirecting root backoffice asset requests into `/cms/...`.
- Inject the mounted backoffice path into the rendered Umbraco shell so the frontend uses `/cms/umbraco` intentionally.
- Rewrite fingerprinted mounted backoffice asset requests to the unversioned asset routes Umbraco actually serves.
- Keep the `/cms`-prefixed entry route and OIDC callback behavior intact.

## Capabilities

### Modified Capabilities
- `backoffice-oidc-authentication`: mounted `/cms` backoffice route loads its static assets and frontend shell successfully.

## Impact

- Affected code in `src/OpenSaur.Umbraco.Web/Program.cs`.
- Preserves the mounted `/cms/umbraco` entry route while allowing mounted `/cms/umbraco/backoffice/<fingerprint>/...` asset URLs to resolve through the underlying `/umbraco/backoffice/...` routes.
