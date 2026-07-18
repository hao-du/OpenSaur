# Zentry Shared HTTP Error Helper Design

## Summary

Extract generic Axios error parsing from the OIDC client feature into a shared helper under `src/OpenSaur.Zentry.Web/client/src/infrastructure/http/` so other features can reuse the same API error message behavior.

## Goals

- Create a reusable `getCommonApiErrorMessage` helper in frontend infrastructure.
- Keep feature API modules focused on request/response logic instead of shared error parsing.
- Preserve the current OIDC client error message behavior.

## Non-Goals

- Introducing a full shared HTTP client abstraction.
- Refactoring all API calls to a new transport layer.
- Changing existing user-facing error text behavior.

## Recommended Approach

### Shared Infrastructure

- Create `src/OpenSaur.Zentry.Web/client/src/infrastructure/http/`.
- Add a small shared helper file such as `apiErrorHelpers.ts`.
- Move generic Axios response parsing into `getCommonApiErrorMessage(error, fallback)`.
- Move the generic status check into a reusable helper such as `isApiErrorStatus(error, statusCode)`.

### Feature Integration

- Update `features/oidc-clients/api/oidcClientsApi.ts` to import the shared helpers from infrastructure.
- Remove the OIDC-specific helper names because the logic is not feature-specific.
- Keep request config and OIDC endpoint calls in the feature module.

## Error Handling Behavior

`getCommonApiErrorMessage` should preserve the current lookup order:

1. `response.data.detail`
2. first validation message from `response.data.errors`
3. `response.data.title`
4. Axios error message
5. provided fallback

`isApiErrorStatus` should return `true` only when the value is an Axios error and `response.status` matches the requested status code.

## File Changes

- Create: `src/OpenSaur.Zentry.Web/client/src/infrastructure/http/apiErrorHelpers.ts`
- Modify: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/api/oidcClientsApi.ts`
- Modify: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/hooks/useCreateOidcClient.ts`
- Modify: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/hooks/useEditOidcClient.ts`
- Modify: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/hooks/useDeleteOidcClient.ts`
- Modify: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/hooks/useOidcClientsQuery.ts`

## Manual Verification

- `npm run build-dev` succeeds.
- OIDC client create, edit, and delete hooks still surface the same error messages for API failures.
- Applications forbidden routing still works when the list request returns `403`.
