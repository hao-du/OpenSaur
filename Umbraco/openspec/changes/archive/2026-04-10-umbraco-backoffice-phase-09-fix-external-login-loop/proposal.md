## Why

After Identity discovery was fixed to advertise public endpoints, the Umbraco external OIDC callback can still loop back into the backoffice authorize flow when the external login handoff does not produce a persisted backoffice session.

## What Changes

- Do not persist OIDC tokens into the Umbraco external login cookie.
- Continue reading the access token during `OnTokenValidated` for claim enrichment and provisioning.
- Add standard ASP.NET external-login claims from OpenSaur OIDC claims so Umbraco can auto-link and sign in the backoffice user.
- Make the user synchronization step tolerant of missing/unstable identity IDs by resolving users by key, email, or username and avoiding false rejection after authorization has passed.
- Ensure auto-linked and already-linked users are approved, email-confirmed, enabled, and unlocked after OpenSaur role/permission authorization passes.
- Ensure the current Umbraco user is assigned to the workspace-derived group, and map OpenSaur `SUPERADMINISTRATOR` to Umbraco's built-in admin group for full backoffice access.
- Keep Umbraco's built-in backoffice authorize and token flow unchanged.

## Capabilities

### Modified Capabilities
- `backoffice-oidc-authentication`: external OIDC login completion avoids oversized/fragile external cookies during the backoffice session handoff.

## Impact

- Affected code in `src/OpenSaur.Umbraco.Web/Authentication/OpenSaurBackOfficeAuthenticationExtensions.cs`.
- Affected code in `src/OpenSaur.Umbraco.Web/Authentication/OpenSaurBackOfficeUserProvisioningService.cs`.
- No database migration is required.
