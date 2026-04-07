## Context

The current `/cms` mount uses ASP.NET Core `UsePathBase(...)` plus a redirect shim for historical root paths. That shim is too broad: it redirects root `/umbraco/backoffice/...` asset requests into `/cms/umbraco/backoffice/...`, and those mounted asset URLs currently do not resolve. At the same time, the Umbraco shell is rendered without a `backoffice-path` attribute, so the frontend does not explicitly know it is mounted under `/cms/umbraco`.

## Decisions

### 1. Narrow the root-path redirect shim

Only redirect the root backoffice entry path (`/umbraco` and `/umbraco/`) plus the OIDC callback/logout endpoints. Do not redirect static asset requests under `/umbraco/backoffice/...`.

### 2. Inject the mounted backoffice path into the rendered shell

Intercept HTML responses for the backoffice shell routes and replace:

- `<umb-app ></umb-app>`

with:

- `<umb-app backoffice-path="/cms/umbraco"></umb-app>`

This makes the frontend use the mounted backoffice path explicitly for its own route handling.

### 3. Rewrite fingerprinted mounted backoffice asset requests

The rendered backoffice shell emits fingerprinted asset URLs like:

- `/cms/umbraco/backoffice/<fingerprint>/css/umb-css.css`
- `/cms/umbraco/backoffice/<fingerprint>/apps/app/app.element.js`

Umbraco is currently serving the actual assets at unversioned routes such as:

- `/umbraco/backoffice/css/umb-css.css`
- `/umbraco/backoffice/apps/app/app.element.js`

So the server rewrites mounted fingerprinted asset requests by stripping the fingerprint segment after `UsePathBase(...)`, turning:

- `/umbraco/backoffice/<fingerprint>/...`

into:

- `/umbraco/backoffice/...`

before Umbraco handles the request.

### 4. Keep `/cms` path-base handling for the external OIDC callback

The server-side external OpenID Connect callback still relies on the `/cms` path base so the issuer callback remains `/cms/signin-oidc`.

## Risks / Trade-offs

- The HTML response injection and fingerprint rewrite are focused compatibility shims rather than first-class Umbraco configuration hooks.
- If Umbraco changes the rendered `<umb-app>` markup in a future version, the injection string may need to be updated.
- If Umbraco changes its static asset fingerprint format, the fingerprint-segment detection may need to be updated.

## Verification

- Build the Umbraco project.
- Verify `http://localhost:5320/cms/umbraco` returns HTML with a mounted `backoffice-path`.
- Verify mounted fingerprinted backoffice CSS/JS asset requests no longer return 404.
