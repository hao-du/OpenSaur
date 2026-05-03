# Identity Login Flows

This document describes the current authentication flow used by `OpenSaur.Umbraco.Web` for Umbraco Backoffice sign-in.

## Current Model

The app uses Umbraco Backoffice external login with OpenID Connect (provider name: `CoreGate`).

Authentication is configured from `Oidc` settings:

- `Authority`
- `ClientId`
- `ClientSecret`
- `CallbackPath` (default `/signin-oidc`)
- `SignedOutCallbackPath` (default `/signout-callback-oidc`)
- `DefaultCulture`
- `AllowInsecureDiscoveryEndpoints`

## Runtime Flow

1. User opens Umbraco Backoffice login.
2. User chooses external provider `CoreGate`.
3. App challenges OIDC using authorization code flow + PKCE.
4. Identity provider redirects to configured `CallbackPath`.
5. On token validation:
- access token must exist and be readable as JWT
- required app claims are copied from access token when missing (`permissions`, `roles`, `workspace_id`, `workspace_name`, impersonation claims)
- standard external login claims are ensured (`nameidentifier`, `name`, `email`)
- `IdentitySession.TryCreate(...)` validates access eligibility
6. If valid, workspace group is created/synchronized in Umbraco.
7. Auto-link + external-login sync updates Umbraco user profile, groups, culture, approval state, and start nodes.
8. Sign-in completes into Umbraco Backoffice.

## Authorization Requirements

Backoffice access is denied unless user has one of:

- role `SUPER ADMINISTRATOR` (normalized comparison), or
- permission `Umbraco.CanManage`

If impersonation is active, super-admin elevation is intentionally suppressed.

## Workspace Group Provisioning

Workspace access is managed by `BackOfficeUserProvisioningService`.

Behavior:

- each workspace maps to one managed Umbraco user group
- managed group description is `Managed by Zentry.`
- group alias format is `workspace{WorkspaceIdWithoutDashesWithFirstCharUpper}`
- legacy alias fallback: raw workspace GUID string
- managed group is granted `Content` and `Media` sections
- super admins also receive built-in `admin` + `sensitive data` groups

On each external login, provisioning also repairs persisted user-group assignment when needed.

## Claims Contract Used By Umbraco

Application claims consumed by this project:

- `sub`
- `name`
- `preferred_username`
- `email`
- repeated `roles`
- repeated `permissions`
- `workspace_id`
- `workspace_name`
- `impersonation_original_user_id`
- `impersonated_user_id`

## Key Implementation Files

- auth bootstrap: `src/OpenSaur.Umbraco.Web/Program.cs`
- OIDC options model: `src/OpenSaur.Umbraco.Web/Authentication/OidcOptions.cs`
- OIDC + Backoffice login wiring: `src/OpenSaur.Umbraco.Web/Authentication/BackOfficeAuthenticationExtensions.cs`
- session claim parsing + access gate: `src/OpenSaur.Umbraco.Web/Authentication/IdentitySession.cs`
- claim constants: `src/OpenSaur.Umbraco.Web/Authentication/ClaimTypes.cs`
- Umbraco user/group sync: `src/OpenSaur.Umbraco.Web/Authentication/BackOfficeUserProvisioningService.cs`

## Deployment Notes

- Ensure `Oidc:Authority` is reachable by the app.
- In production, `AllowInsecureDiscoveryEndpoints` should normally be `false`.
- `CallbackPath` and `SignedOutCallbackPath` are appended to Umbraco reserved paths at startup.
- Forwarded headers (`X-Forwarded-For`, `X-Forwarded-Proto`, `X-Forwarded-Host`) are enabled in `Program.cs`; proxy configuration must preserve these correctly.
