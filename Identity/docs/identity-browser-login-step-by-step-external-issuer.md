# Identity Browser Login Step By Step: `localhost:5220/identity` -> `app.duchihao.com/identity`

This document describes the case where:

- browser entry URL is `http://localhost:5220/identity`
- the Identity SPA is running locally
- the OIDC issuer is remote:
  - `https://app.duchihao.com/identity`

In this mode, the local SPA behaves like an external OIDC client. It does not use the local login form as the primary login screen.

## Main Files

- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\Program.cs`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\Infrastructure\Hosting\FrontendAppRoutes.cs`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\Infrastructure\Oidc\OidcOptionsExtensions.cs`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\client\src\shared\config\env.ts`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\client\src\features\auth\hooks\useAuthBootstrap.ts`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\client\src\pages\login\LoginPage.tsx`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\client\src\features\auth\utils\firstPartyOidc.ts`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\client\src\pages\auth-callback\AuthCallbackPage.tsx`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\Features\Auth\AuthEndpoints.cs`

## Step 1: Browser requests the shell

URL:

- `GET http://localhost:5220/identity`

Backend code:

- `Program.cs`
- `FrontendAppRoutes.MapShellRoutes(...)`
- `FrontendAppRoutes.ServeShellAsync(...)`

Result:

- server returns `index.html`

## Step 2: Browser requests runtime config

URL:

- `GET http://localhost:5220/identity/app-config.js`

Backend code:

- `FrontendAppRoutes.ServeRuntimeConfigAsync(...)`

Important logic:

- `OidcOptionsExtensions.IsIssuerHostedRequest(...)`

What happens:

1. backend compares current app base URI with issuer URI
2. they are different hosts
3. runtime config sets:
   - `firstPartyAuth.isIssuerHostedApp = false`

Result:

- frontend knows this app is not the issuer host

## Step 3: Frontend bootstraps auth state

Frontend code:

- `useAuthBootstrap()` in `useAuthBootstrap.ts`

Requests:

- `POST /identity/api/auth/web-session/refresh`
- `GET /identity/api/auth/me`

If user is not authenticated:

- frontend navigates to `/login?returnUrl=%2F`

## Step 4: Browser lands on local login page

URL:

- `GET http://localhost:5220/identity/login?returnUrl=%2F`

Frontend code:

- `LoginPage.tsx`

Decision:

- `firstPartyOidc.isCurrentAppHostedByIssuer()` returns `false`

What happens next:

- the login page does not stay on local username/password flow
- it builds an authorization URL pointing to the remote issuer

Code:

- `buildFirstPartyAuthorizeUrl(...)` in `firstPartyOidc.ts`
- `createFirstPartyAuthorizationState(...)` in `firstPartyOidc.ts`

Resulting URL shape:

- `https://app.duchihao.com/identity/connect/authorize?...`

## Step 5: Browser redirects to remote issuer authorize endpoint

URL:

- `GET https://app.duchihao.com/identity/connect/authorize?...`

This is now handled by the remote deployed Identity issuer, not the local app.

Backend code on issuer:

- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\Features\Auth\Oidc\OidcEndpoints.cs`
- `D:\OpenSaur\Identity\src\OpenSaur.Identity.Web\Features\Auth\Oidc\IssuerAuthenticationFlow.cs`

What happens:

1. remote issuer checks local auth cookie on `app.duchihao.com`
2. if user is not signed in there, remote issuer redirects to:
   - `/identity/login?returnUrl=/identity/connect/authorize?...`
3. user signs in on the remote login page
4. issuer resumes the same `/connect/authorize` request

## Step 6: Remote issuer issues authorization code back to local app

Redirect target:

- `http://localhost:5220/identity/auth/callback?code=...&state=...`

Why:

- the local app registered its callback URI in the authorize request

## Step 7: Local callback page exchanges the code

Frontend code:

- `AuthCallbackPage.tsx`

Frontend request:

- `POST /identity/api/auth/web-session/exchange`

Backend code:

- `AuthEndpoints.cs`

What happens:

1. local backend receives the authorization code from the SPA
2. local backend exchanges that code with the issuer token endpoint
3. local backend writes local web-session cookies
4. SPA fetches `/identity/api/auth/me`

## Step 8: SPA navigates to final route

Frontend code:

- `AuthCallbackPage.tsx`

What happens:

1. callback page reads `state.returnUrl`
2. clears remembered return target
3. navigates to final app route, usually `/`

## Short Summary

1. open `http://localhost:5220/identity`
2. local SPA boots
3. local runtime config says `isIssuerHostedApp = false`
4. local login page redirects out to `https://app.duchihao.com/identity/connect/authorize`
5. remote issuer shows login
6. remote issuer returns `code` to `http://localhost:5220/identity/auth/callback`
7. local backend exchanges code
8. local SPA becomes authenticated

