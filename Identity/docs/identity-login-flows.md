# Identity Login Flows

This document explains how login works for:

- the first-party web application hosted by this service
- third-party applications that integrate with this Identity server through OpenID Connect

It also explains where tokens and cookies live, which endpoints are involved, and how the two flows differ.

## Purpose

The system supports two different client patterns:

- **First-party web app**
  - the React app hosted on the same domain as the identity service
  - uses backend-assisted token handling
  - receives the JWT access token in the frontend
  - keeps the refresh token only in a backend-managed `httpOnly` cookie

- **Third-party client**
  - an external app integrating with this Identity server
  - uses the standard OpenID Connect authorization code flow
  - exchanges the authorization code directly through the token endpoint
  - manages its own tokens

The first-party flow is intentionally safer for browser JavaScript because the refresh token is never exposed to the frontend runtime.

## Key Terms

- **Authorization code**
  - a short-lived code returned after successful login and consent
  - must be exchanged for tokens

- **Access token**
  - the JWT used to call protected API endpoints
  - in the first-party FE flow, this is stored in memory only

- **Refresh token**
  - a longer-lived token used to get a new access token
  - in the first-party FE flow, this is kept only in a backend-managed `httpOnly` cookie

- **Identity application session cookie**
  - the server-side login session created by ASP.NET Core Identity
  - used so the authorize endpoint can reuse the hosted login session

- **Return URL**
  - the protected page the user originally tried to open
  - preserved so the user can be redirected back after login

## High-Level Comparison

| Topic | First-party web app | Third-party client |
|---|---|---|
| Browser app hosted by this service | Yes | No |
| Uses `/api/auth/login` | Yes | No |
| Uses `/connect/authorize` | Yes | Yes |
| Uses `/connect/token` directly from client | No | Yes |
| Backend-assisted token exchange | Yes | No |
| Access token returned to browser JS | Yes | Usually yes |
| Refresh token returned to browser JS | No | Depends on client implementation |
| Refresh token stored in backend `httpOnly` cookie | Yes | No |
| Redirect back to previous protected page | Yes | Managed by third party |

## First-Party Login Flow

This is the intended FE phase design for the hosted React app.

### Goal

Let the frontend receive and use a JWT access token while keeping the refresh token out of browser JavaScript.

### Step-by-Step Flow

1. The user opens a protected frontend route.
   - Example: `/`
   - The frontend sees there is no valid in-memory access token.
   - The frontend preserves the requested route as `returnUrl`.
   - The frontend redirects the user to `/login?returnUrl=/`.

2. The user submits credentials on the hosted login page.
   - Frontend calls `POST /api/auth/login`.
   - Backend validates username/password.
   - Backend creates the ASP.NET Core Identity application session cookie.

3. The frontend starts the first-party OpenID Connect authorize flow.
   - Frontend redirects the browser to `/connect/authorize?...`.
   - Because the hosted login session already exists, the authorize endpoint can continue without asking for credentials again.

4. The authorize endpoint returns an authorization code to the frontend callback route.
   - Browser is redirected to `/auth/callback?code=...&state=...`.

5. The frontend sends the authorization code to a backend helper endpoint.
   - Frontend calls `POST /api/auth/web-session/exchange`.
   - Request contains the authorization `code`.

6. The backend exchanges the code for tokens.
   - Backend calls `/connect/token` on behalf of the first-party client.
   - Backend receives:
     - access token
     - refresh token
     - other token payload fields if applicable

7. The backend stores the refresh token in a secure cookie.
   - The cookie should be:
     - `httpOnly`
     - `secure`
     - same-site according to the same-host deployment rules
   - JavaScript cannot read this cookie.

8. The backend returns the access token to the frontend.
   - Frontend stores the access token in memory only.
   - Frontend does not write the access token to `localStorage` or `sessionStorage`.

9. The frontend bootstraps authenticated state.
   - Frontend can call `/api/auth/me` with the access token.
   - If the user requires password rotation, frontend redirects to `/change-password`.
   - Otherwise frontend returns the user to the preserved `returnUrl`.

### Where State Lives In The First-Party Flow

**Frontend memory**
- access token
- access token expiry time
- lightweight auth state

**Browser cookies**
- Identity application session cookie
- refresh-token cookie managed by backend

**Not stored in browser JavaScript**
- refresh token

### First-Party Refresh Flow

1. The frontend monitors access token expiry.
2. Before expiry, the frontend calls `POST /api/auth/web-session/refresh`.
3. The browser automatically sends the secure refresh cookie with that request.
4. The backend reads the refresh token from the cookie.
5. The backend calls `/connect/token` with `grant_type=refresh_token`.
6. The backend receives a new access token and rotated refresh token.
7. The backend rewrites the refresh cookie.
8. The backend returns the new access token to the frontend.
9. The frontend replaces the old in-memory access token.

### First-Party Failure Cases

**Login failure**
- `POST /api/auth/login` returns unauthorized
- frontend stays on `/login`

**Code exchange failure**
- `/api/auth/web-session/exchange` fails
- frontend clears temporary auth state and returns to `/login`

**Refresh failure**
- `/api/auth/web-session/refresh` fails because the refresh token is expired, missing, revoked, or invalid
- frontend clears in-memory auth state
- frontend redirects to `/login?returnUrl=currentRoute`

**Password change required**
- `/api/auth/me` shows `RequirePasswordChange = true`
- frontend redirects to `/change-password`
- after successful password change, frontend restarts the auth/bootstrap flow

## Third-Party Login Flow

This is the normal OpenID Connect integration flow for external applications.

### Goal

Allow third-party applications to authenticate users with this Identity server using a standard OIDC client contract.

### Step-by-Step Flow

1. The third-party application redirects the browser to the authorize endpoint.
   - Browser goes to `/connect/authorize?...`.
   - The request includes that client's own:
     - `client_id`
     - `redirect_uri`
     - `response_type=code`
     - scopes
     - state
     - PKCE values if the client uses PKCE

2. The Identity server authenticates the user.
   - If the user is not signed in, the hosted login flow runs.
   - If the user already has a valid Identity application session cookie, login can be reused.

3. The authorize endpoint redirects back to the third-party callback.
   - Browser is redirected to the third-party `redirect_uri`.
   - The redirect contains an authorization `code`.

4. The third-party client exchanges the authorization code directly.
   - Third party calls `/connect/token`.
   - This exchange is part of the standard OIDC client contract.

5. The Identity server returns tokens to the third party.
   - access token
   - refresh token if allowed
   - other token fields as appropriate

6. The third-party application manages its own tokens.
   - Token storage and refresh strategy are owned by that client.
   - The first-party backend helper endpoints are not used for third-party clients.

### Important Boundary

Third-party clients should continue to use:

- `/connect/authorize`
- `/connect/token`

Third-party clients should **not** use first-party-only helper endpoints such as:

- `POST /api/auth/web-session/exchange`
- `POST /api/auth/web-session/refresh`

Those helper endpoints exist only for the hosted first-party web app.

## Why The First-Party Flow Is Different

The first-party web app has a stricter security goal:

- the browser frontend must receive a JWT access token
- the refresh token must stay backend-managed in an `httpOnly` cookie

If the frontend exchanged the code directly at `/connect/token`, the refresh token would normally be visible to browser JavaScript. The backend-assisted web-session flow avoids that exposure.

## Endpoint Summary

### First-party web app

- `POST /api/auth/login`
  - validate credentials
  - create hosted login session

- `GET or POST /connect/authorize`
  - issue authorization code for the first-party client

- `POST /api/auth/web-session/exchange`
  - backend exchanges code for tokens
  - backend sets refresh cookie
  - frontend receives access token

- `POST /api/auth/web-session/refresh`
  - backend uses refresh cookie to rotate access token

- `GET /api/auth/me`
  - bootstrap authenticated user state

- `POST /api/auth/change-password`
  - self-service password rotation

- `POST /api/auth/logout`
  - clear hosted session
  - clear refresh cookie

### Third-party client

- `GET or POST /connect/authorize`
  - initiate auth flow

- `POST /connect/token`
  - exchange code for tokens
  - refresh tokens later

## Current Status In This Repository

At the time of writing:

- the backend Identity and OIDC foundation already exists
- the first-party frontend shell is being built in `src/OpenSaur.Identity.Web/client`
- the first-party backend-assisted web-session endpoints are part of the approved FE design and are expected to be implemented as part of the FE auth phase

So this document describes:

- the standard third-party flow already supported by the backend
- the approved first-party FE target flow for the current frontend phase
