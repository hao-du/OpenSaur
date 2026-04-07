## Why

The current Umbraco CMS project has no backoffice single-sign-on integration, so backoffice access cannot be delegated to the existing Identity issuer or constrained by Identity-issued roles and permissions. This slice is needed now to make Umbraco behave like another issuer-managed client application while preserving the workspace and impersonation semantics already defined by the Identity platform.

## What Changes

- Add Umbraco backoffice OpenID Connect login against the configured Identity issuer using a confidential client registration.
- Auto-redirect the Umbraco backoffice login screen to the external Identity login provider.
- Allow backoffice sign-in only when the effective authenticated user has the `SUPERADMINISTRATOR` role or the `Umbraco.CanManage` permission.
- Auto-provision missing Umbraco backoffice users during successful external login.
- Create and reuse workspace-based Umbraco user groups named from the effective `workspace_id` claim.
- Ensure auto-provisioned non-superadministrator users have no root-node access by default.
- Ensure effective `SUPERADMINISTRATOR` sessions receive full root-node access in Umbraco.
- Preserve impersonation semantics by provisioning and signing in the effective user represented by the issuer token.

## Capabilities

### New Capabilities
- `backoffice-oidc-authentication`: Umbraco backoffice external-login integration, access gating from Identity claims, and auto-provisioning of effective Umbraco users and workspace groups.

### Modified Capabilities
- None.

## Impact

- Affected code in `src/OpenSaur.Umbraco.Web/Program.cs` and new authentication/provisioning components under `src/OpenSaur.Umbraco.Web/`.
- Adds a backoffice auth-provider manifest under `src/OpenSaur.Umbraco.Web/App_Plugins/`.
- Updates Umbraco configuration for OIDC, callback reserved paths, and backoffice login redirection.
- Depends on the existing Identity issuer claim contract documented in `docs/identity-login-screen/identity-login-flows.md`.
