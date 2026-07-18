# Zentry Backend-Enforced Forbidden Flow For Applications

## Summary

Move authorization for the Applications area fully to the backend. The frontend must stop decoding the access token to decide whether a user is a super administrator. Instead, the OIDC client API remains protected by backend authorization, and the Applications UI responds to `403 Forbidden` by showing a dedicated forbidden page.

## Goals

- Keep the backend as the security boundary for super-administrator-only functionality.
- Remove client-side role parsing for the Applications route and menu visibility.
- Show a clear `403` page in the SPA when a signed-in user reaches functionality they are not allowed to use.

## Non-Goals

- Introducing a new capability endpoint or permissions bootstrap payload.
- Hiding unauthorized navigation based on a new server-provided capability model.
- Adding automated frontend or backend tests.

## Current Problem

The current frontend uses `hasSuperAdministratorRole(authSession.accessToken)` to decide whether `/applications` can render and whether the Applications item appears in navigation. That is only a UX check because browser code can be modified, bypassed, or replayed. The backend already has a super-admin authorization policy on the OIDC client API, so the frontend check creates a false sense of security and duplicates logic in an unsafe place.

## Recommended Approach

### Backend

- Keep the OIDC client API group protected with `RequireAuthorization(SuperAdminAuthorization.PolicyName)`.
- Rely on ASP.NET Core authorization middleware to return `403 Forbidden` when an authenticated user lacks the required role.
- Keep unauthenticated behavior unchanged so requests without a valid session still follow the existing authentication flow.

### Frontend Routing

- Remove `hasSuperAdministratorRole(authSession.accessToken)` from route gating in `App.tsx`.
- Keep `/applications` as a normal authenticated route so the page can load and react to backend authorization results.
- Add a dedicated route such as `/forbidden` that renders a reusable forbidden page.

### Frontend Page Behavior

- Let `OidcClientsPage` load through its normal React Query hooks.
- When the OIDC clients fetch fails with HTTP `403`, redirect to `/forbidden` or render the forbidden page in place.
- Prefer centralizing `403` handling in the feature's API/query layer if that can be done cleanly without spilling unrelated complexity into other features.

### Frontend Navigation

- Remove access-token role decoding from the side menu.
- Leave the Applications menu item visible for authenticated users for now.
- If the product later wants hidden navigation for unauthorized users, use a backend-owned capability source rather than client-decoded claims.

## Error Handling

- `403`: navigate to the forbidden page with a message that the current account does not have permission to access Applications.
- Other API failures: preserve the current page-level error and retry behavior.
- Missing or expired session: preserve the existing session restoration and login behavior.

## Manual Verification

- Signed in as super administrator: `/applications` loads and CRUD calls still work.
- Signed in as non-super administrator: opening `/applications` results in the forbidden page after the API returns `403`.
- Signed in as non-super administrator: direct API call to `/api/oidc-client/get` returns `403`.
- Signed out user: existing auth/session behavior remains unchanged.

## Implementation Notes

- Remove the now-unused `accessTokenClaims` helper if nothing else depends on it.
- Keep the change scoped to Applications authorization only. Do not refactor unrelated auth or navigation behavior in the same pass.
