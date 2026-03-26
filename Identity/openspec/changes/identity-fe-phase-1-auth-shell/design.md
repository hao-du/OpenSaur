## Context

The backend identity foundation already supports first-party and third-party OpenIddict authorization code flow, JSON login/logout helpers, bootstrap password rotation, and same-host auth-server session reuse. What is missing is the first-party browser client that runs on the same host, drives the hosted login flow, completes the callback, holds the returned JWT access token, refreshes it before expiry, and redirects the user back to the page they originally requested.

This FE phase must stay intentionally small. The user wants an auth-only slice first so the end-to-end flow can be tested and tracked without mixing in admin CRUD screens. The frontend stack is fixed for this phase:

- React under `src/OpenSaur.Identity.Web/client`
- Vite for frontend development
- ASP.NET Core serving the built client assets for same-host deployment
- TanStack Query for server-state coordination
- React Hook Form for forms
- axios for API calls
- atomic design for reusable UI composition
- Lucide icons and MUI `Divider`
- responsive behavior for mobile, tablet, and desktop

Security and UX constraints also matter:

- `/api/*` stays backend API traffic, all other app routes belong to the web UI
- successful login must return the user to the previous protected route
- the FE must hold the access token in memory only
- the refresh token must remain in a backend-managed `httpOnly` cookie
- the FE must refresh the access token before expiry when the server still accepts the refresh path
- expired or invalid session state must return the user to `/login`

## Goals / Non-Goals

**Goals:**

- Deliver a first-party auth shell that exercises the backend identity service end to end in a browser.
- Keep frontend code feature-first and aligned with the backend vertical-slice shape without overcomplicating the first FE slice.
- Support `/login`, `/auth/callback`, `/change-password`, and one protected shell route.
- Use the same OpenIddict authorization-code model for the first-party FE instead of inventing a second auth protocol.
- Keep access tokens out of local persistence and refresh them before expiry through a backend-controlled refresh path.
- Preserve the user's intended destination through login, callback completion, password rotation, and refresh failures.
- Make the initial UI responsive and reusable enough to support later admin pages without building those pages yet.

**Non-Goals:**

- Users, roles, permissions, user-role, or workspace CRUD UI
- Full dashboard widgets or analytics surfaces
- Impersonation or advanced admin UX
- Offline mode, background sync, or PWA behavior
- Replacing OpenIddict with a custom first-party auth model

## Decisions

### 1. Place the frontend inside `src/OpenSaur.Identity.Web/client`

The React app will live inside the existing ASP.NET Core host repository at `src/OpenSaur.Identity.Web/client`. This keeps the FE and BE in one deployable host while still allowing the FE to evolve with normal frontend tooling.

Alternatives considered:

- Separate frontend repository: rejected because same-host auth integration and coordinated delivery are the immediate priorities.
- Put frontend source at the repo root: rejected because the FE belongs to the identity host and should stay close to its backend integration points.

### 2. Use Vite for development and ASP.NET Core static hosting for deployment

Vite will own the FE development loop, but the production/deployed shape stays same-host: ASP.NET Core will serve the built frontend assets and continue to own `/api/*` and `/connect/*`.

This keeps the development experience fast without changing the production routing contract.

Alternatives considered:

- No separate FE dev server: simpler on paper, but too slow and awkward for a React/MUI workflow.
- Separate FE host in production: rejected because the user explicitly wants the same host and same domain.

### 3. Use a light feature-first frontend structure with atomic design layers

The FE will use a feature-first layout with thin routes/pages, shared infrastructure, and explicit atomic design UI layers. A practical structure for this phase is:

```text
client/src/
  app/
  pages/
  features/auth/
  components/atoms/
  components/molecules/
  components/organisms/
  components/templates/
  shared/
```

This mirrors the backend's feature intent without forcing a heavier FSD taxonomy into an auth-only slice.

Alternatives considered:

- Pure technical layers (`components/hooks/services/pages`): rejected because it usually drifts into mixed ownership as feature count grows.
- Full formal Feature-Sliced Design: rejected for Phase 1 FE because it adds more ceremony than value for the initial auth shell.

### 4. Keep the first-party FE on OpenIddict authorization code flow with backend-assisted token handling

The FE will not use a parallel non-OIDC auth model. After a successful `/api/auth/login`, the browser continues through the same first-party OpenIddict authorize/callback flow already established in the backend design. The difference is that the first-party FE will use thin backend web-session endpoints to complete the sensitive token work:

- the FE callback route receives the authorization `code`
- the FE posts that `code` to a first-party backend helper endpoint
- the backend exchanges the code through the token endpoint
- the backend returns the JWT access token to the FE
- the backend stores the refresh token in a secure `httpOnly` cookie

This keeps the first-party FE aligned with authorization code flow while preventing the refresh token from ever being exposed to browser JavaScript.

Alternatives considered:

- Custom first-party token APIs: rejected because it would create a second auth model beside OpenIddict.
- Cookie-only browser session: rejected because the agreed contract is that JWT access tokens are returned to the FE.

### 5. Store access tokens in memory and keep refresh tokens in backend-managed `httpOnly` cookies

The FE will keep the access token in memory only and will never persist it to localStorage or sessionStorage. The backend remains responsible for refresh token custody through an `httpOnly` cookie. The FE will call a first-party backend refresh endpoint before expiry and receive a replacement access token without exposing the refresh token to JavaScript.

The intended first-party contract is:

- `POST /api/auth/web-session/exchange`
  - FE sends the authorization `code`
  - backend exchanges the code for tokens
  - backend writes the refresh token cookie
  - backend returns the access token payload to the FE
- `POST /api/auth/web-session/refresh`
  - FE asks for proactive refresh
  - backend reads the refresh cookie and calls the token endpoint
  - backend rotates the refresh cookie when needed
  - backend returns the replacement access token payload to the FE

Alternatives considered:

- Store both tokens in browser storage: rejected because of XSS risk.
- Full BFF session with no FE-managed JWT: rejected because it conflicts with the agreed requirement that the FE receives the JWT token.

### 6. Centralize token lifecycle handling in shared auth infrastructure

Token expiry, proactive refresh, auth bootstrap, and redirect-back behavior will live in shared auth infrastructure under `features/auth` and `shared/api`, not inside pages. The FE should:

- decode or otherwise track access-token expiry
- attempt refresh before expiry
- call the backend first-party web-session endpoints to confirm the session/refresh path is still valid when needed
- replace the in-memory access token after a successful refresh
- clear auth state and redirect to `/login?returnUrl=currentPath` if refresh fails or the access token is already expired without a valid recovery path

This avoids scattering refresh logic across axios interceptors, route components, and page code.

Alternatives considered:

- Page-owned refresh logic: rejected because it duplicates behavior and breaks consistency.
- Interceptor-only hidden refresh: rejected because route guards and callback/bootstrap behavior still need explicit orchestration.

### 7. Keep the first FE route set intentionally minimal

Phase 1 FE will only include:

- `/login`
- `/auth/callback`
- `/change-password`
- one protected shell route such as `/`

This is enough to validate the whole hosted login lifecycle, forced password change, and token refresh behavior without expanding into admin CRUD too early.

Alternatives considered:

- Auth pages only with no protected shell: rejected because it would not prove guarded-route behavior.
- Full admin shell now: rejected because the user explicitly wants an auth-only first FE phase.

### 8. Use TanStack Query, React Hook Form, axios, Lucide, and MUI in bounded roles

- TanStack Query owns `/api/auth/me` and related server-state invalidation
- React Hook Form owns login and password-change forms
- axios is the shared API client
- Lucide provides icons
- MUI is used selectively for layout primitives such as `Divider` and other responsive building blocks

The FE should not wrap every dependency in excessive abstraction during this phase; the goal is a clean, direct foundation.

## Risks / Trade-offs

- [Vite development uses a separate FE dev server while production is same-host] -> Keep same-host deployment as the contract and document the dev/prod difference clearly.
- [OpenIddict callback handling in the browser is more complex than a custom login API] -> Reuse the backend's existing first-party client model and keep callback logic centralized in one route/module.
- [In-memory access tokens are lost on refresh or tab restart] -> Re-bootstrap through the backend-managed refresh path on app startup and protected-route entry when a valid refresh session still exists.
- [Refresh-before-expiry timing can race across tabs] -> Keep the first FE phase simple, centralize refresh orchestration, and let invalid/expired refresh attempts fall back to login cleanly.
- [Responsive auth UI can still drift if atomic layers are ignored] -> Define the auth pages on top of template/organism layers from the start instead of composing directly in route files.
- [Frontend stack growth can tempt early admin UI work] -> Keep the route set and tasks explicitly limited to the auth shell only.

## Migration Plan

1. Create the frontend app under `src/OpenSaur.Identity.Web/client` with the agreed FE stack and same-host assumptions.
2. Add ASP.NET Core host integration for Vite development and built-asset serving in deployment.
3. Add first-party backend web-session endpoints for authorization-code exchange and refresh-cookie-backed token rotation.
4. Implement shared auth infrastructure for callback completion, session bootstrap, refresh-before-expiry, and redirect-back.
5. Implement the auth-only routes and responsive UI layers.
6. Add automated frontend/e2e coverage for login, callback, password change, refresh, logout, and expired-session fallback.
7. Validate same-host routing so `/api/*` remains backend-only and non-API routes are served by the FE.

Rollback can disable FE asset serving and remove the client integration without affecting the already-complete backend identity foundation.

## Open Questions

- Whether the first protected route should be `/` or `/dashboard` in the initial FE slice.
- Whether Playwright should be introduced in this phase or deferred to a follow-up FE hardening slice if existing test infrastructure is enough for the first pass.
