## Why

Starting an impersonation session from a localhost first-party client can currently redirect back into the issuer's `/connect/authorize` flow and fail with a `500` response instead of completing the authorization-code handoff.

## What Changes

- Diagnose and fix the issuer-side impersonation continuation path used to resume OIDC authorization after impersonation starts.
- Ensure resumed authorization requests for localhost first-party clients complete without server errors.
- Record the expected behavior in the authentication spec.

## Capabilities

### Modified Capabilities

- `identity-authentication`: Impersonation-driven authorization continuations for managed first-party clients complete without issuer-side server errors.

## Impact

- Impersonation bridge and resume handlers under `src/OpenSaur.Identity.Web/Features/Auth/Impersonation/`
- OIDC authorize flow under `src/OpenSaur.Identity.Web/Features/Auth/Oidc/`
- Managed OIDC client resolution and runtime config under `src/OpenSaur.Identity.Web/Infrastructure/Oidc/`
