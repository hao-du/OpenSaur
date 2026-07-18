# Zentry Client API Layer Refactor Design

## Goal

Replace ad hoc browser `fetch` usage in the Zentry SPA auth flow with a small shared Axios-based API layer that becomes the standard pattern for future client-side HTTP calls.

## Scope

### In Scope

- Add `axios` to the Zentry client.
- Create a shared client HTTP layer under `src/OpenSaur.Zentry.Web/client/src/api/`.
- Move token exchange and user info requests behind API modules instead of calling HTTP directly from auth orchestration code.
- Normalize Axios failures into stable app-level errors for the auth flow.
- Keep the existing PKCE, state validation, session storage, and ID-token fallback logic intact.

### Out of Scope

- Refresh-token interceptors or automatic token renewal.
- Global retry logic.
- Business CRUD APIs.
- Backend changes.
- Unit tests or automation tests.

## Design Approach

Use a small shared API layer now, not a one-off Axios swap and not a full interceptor platform.

The refactor should create a clean boundary:

- `authService.ts` coordinates auth flow
- API modules perform HTTP
- a shared helper owns Axios setup and error normalization

This is enough structure to support future APIs without adding premature complexity.

## Architecture

The client API layer should introduce a few focused modules:

- `api/httpClient.ts`
  - exports an Axios instance factory or thin helper
- `api/apiErrors.ts`
  - converts Axios failures into readable `Error` instances with stable messages
- `api/oidcApi.ts`
  - performs the token exchange request
- `api/userInfo.ts`
  - performs the user info request through Axios

`authService.ts` should stop making raw HTTP calls. It should call `exchangeAuthorizationCode(...)` and `fetchUserInfo(...)`, then continue building session state exactly as it does today.

## Error Handling

The refactor should preserve meaningful failures:

- token exchange failure should still surface the returned HTTP status when available
- user info failure should still allow fallback to ID token parsing
- network/timeout/Axios transport issues should become readable auth errors instead of leaking raw Axios shapes into the UI

## Success Criteria

This work is successful when:

- no `fetch(...)` calls remain in the Zentry client auth flow
- token exchange uses Axios through a dedicated API module
- user info uses Axios through the shared API layer
- `authService.ts` no longer owns raw HTTP request code
- current login, callback, and profile bootstrap behavior still work

## Verification

Verification is manual and build-based:

- `npm install`
- `npm run build` in `src/OpenSaur.Zentry.Web/client`
- `dotnet build src/OpenSaur.Zentry.slnx`
- manual login flow check through CoreGate

No unit tests or automation tests should be added.
