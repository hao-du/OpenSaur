# Identity Browser Login Step By Step: `app.duchihao.com/identity` As Shell And Issuer

This document describes the case where:

- browser entry URL is `https://app.duchihao.com/identity`
- the Identity SPA and the OIDC issuer are the same host

In this mode, the shell is issuer-hosted. The browser uses the local login screen first, then resumes the server-side `/connect/authorize` route.

## Main Files

- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\Program.cs`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\Infrastructure\Hosting\FrontendAppRoutes.cs`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\Infrastructure\Oidc\OidcOptionsExtensions.cs`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\Features\Auth\Oidc\OidcEndpoints.cs`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\Features\Auth\Oidc\IssuerAuthenticationFlow.cs`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\Features\Auth\AuthEndpoints.cs`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\client\src\pages\login\LoginPage.tsx`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\client\src\features\auth\utils\firstPartyOidc.ts`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\client\src\pages\auth-callback\AuthCallbackPage.tsx`

## Step 1: Browser requests the shell

URL:

- `GET https://app.duchihao.com/identity`

Backend code:

- `Program.cs`
- `FrontendAppRoutes.ServeShellAsync(...)`

Result:

- returns `index.html`

## Step 2: Browser requests runtime config

URL:

- `GET https://app.duchihao.com/identity/app-config.js`

Backend code:

- `FrontendAppRoutes.ServeRuntimeConfigAsync(...)`

Important logic:

- `OidcOptionsExtensions.IsIssuerHostedRequest(...)`

What happens:

1. current app base URI matches issuer URI
2. runtime config sets:
   - `firstPartyAuth.isIssuerHostedApp = true`

Result:

- frontend knows it is running on the issuer host

## Step 3: SPA bootstrap checks session

Frontend code:

- `useAuthBootstrap()` in `useAuthBootstrap.ts`

Requests:

- `POST /identity/api/auth/web-session/refresh`
- `GET /identity/api/auth/me`

If there is no session:

- frontend navigates to:
  - `/login?returnUrl=%2F`

## Step 4: Browser lands on local login page

URL:

- `GET https://app.duchihao.com/identity/login?returnUrl=%2F`

Frontend code:

- `LoginPage.tsx`

Decision:

- `isCurrentAppHostedByIssuer()` returns `true`

What happens:

- the page stays on the local login form
- it does not redirect out to another host

## Step 5: User submits credentials to local login API

Frontend request:

- `POST /identity/api/auth/login`

Backend code:

- `AuthEndpoints.cs`

Result:

- local Identity application cookie is issued on `app.duchihao.com`

## Step 6: Local login page resumes the original auth continuation

This branch matters when the original requested route was not just `/`, but a server-side auth route such as:

- `/identity/connect/authorize?...`

Frontend code:

- `LoginPage.tsx`
- `isIssuerAuthenticationContinuationReturnUrl(...)` in `firstPartyOidc.ts`

What happens:

1. page checks whether `returnUrl` is an auth continuation
2. if yes, it calls:
   - `window.location.assign(returnUrl)`
3. browser goes back to `/connect/authorize?...`

## Step 7: Browser requests `/connect/authorize`

Backend code:

- `OidcEndpoints.cs`

What happens:

1. backend authenticates current local cookie session
2. loads user, workspace, roles, permissions
3. creates OIDC principal with:
   - `AuthSessionPrincipalFactory.Create(...)`
4. returns:
   - `Results.SignIn(...OpenIddict...)`

## Step 8: OpenIddict redirects to callback

Redirect target:

- `/identity/auth/callback?code=...&state=...`

This callback is still inside the same host:

- `https://app.duchihao.com/identity/auth/callback`

## Step 9: SPA callback page exchanges code

Frontend code:

- `AuthCallbackPage.tsx`

Frontend request:

- `POST /identity/api/auth/web-session/exchange`

Backend code:

- `AuthEndpoints.cs`

What happens:

1. backend exchanges code against local issuer token endpoint
2. backend writes session cookies for the SPA
3. SPA fetches `/identity/api/auth/me`

## Step 10: SPA navigates to final shell route

Frontend code:

- `AuthCallbackPage.tsx`

Result:

- authenticated shell loads on the same host

## Why This Flow Can Loop If Misdetected

If the frontend mistakenly thinks it is not issuer-hosted:

1. it receives `returnUrl=/identity/connect/authorize?...`
2. instead of resuming that route, it creates a new authorize URL
3. the old authorize URL is stored inside `state.returnUrl`
4. the URL grows recursively

Relevant code:

- `OidcOptionsExtensions.IsIssuerHostedRequest(...)`
- `FrontendAppRoutes.ServeRuntimeConfigAsync(...)`
- `firstPartyOidc.isCurrentAppHostedByIssuer()`
- `LoginPage.tsx`

