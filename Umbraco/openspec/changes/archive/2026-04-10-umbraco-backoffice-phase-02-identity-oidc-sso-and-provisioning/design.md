## Context

The Umbraco project currently boots a standard backoffice and website with no external authentication integration. The existing Identity system already issues authorization-code tokens, exposes the hosted login screen, and emits the effective authorization contract for roles, permissions, workspace, and impersonation state. Umbraco needs to participate as a separate OIDC client while auto-provisioning backoffice users from those issuer claims.

The two technical constraints that matter most are:

- `Umbraco.CanManage` is only emitted in the access token because the Identity issuer places `permissions` in the access token, not the `id_token`.
- Umbraco backoffice authorization and content-tree access are driven by local Umbraco user/group data, so claims alone are not enough once sign-in succeeds.

## Goals / Non-Goals

**Goals:**
- Configure Umbraco backoffice to challenge through the Identity issuer by OpenID Connect.
- Reject backoffice access unless the effective session has `SUPERADMINISTRATOR` or `Umbraco.CanManage`.
- Parse the issuer access token so Umbraco can read `permissions`, `workspace_id`, and impersonation-aware effective-user data.
- Auto-create missing Umbraco users and workspace-named user groups during login.
- Give non-superadministrator users no root-node access by default.
- Give `SUPERADMINISTRATOR` users root-node access across Umbraco.
- Keep issuer URL, client id, and secret in configuration rather than hardcoding them in code.

**Non-Goals:**
- Add backend, frontend, or automation tests.
- Build a custom Identity-side management UI in this slice.
- Implement content permission assignment beyond default no-root access.
- Synchronize Umbraco user deletions or role revocations back to Identity.

## Decisions

### 1. Use Umbraco backoffice external-login support, not a custom auth controller

Umbraco 17 already exposes `AddBackOfficeExternalLogins(...)`, `BackOfficeExternalLoginProviderOptions`, and `ExternalSignInAutoLinkOptions`. This keeps the implementation inside Umbraco’s supported backoffice authentication pipeline instead of layering a separate cookie or bespoke callback endpoint on top.

Alternative considered:
- Implement a custom ASP.NET Core authentication endpoint outside Umbraco.

Why not:
- It would fight Umbraco’s own user sign-in pipeline and make backoffice user auto-linking harder than necessary.

### 2. Parse the access token during OpenID Connect token validation

The Identity issuer places `permissions`, `workspace_id`, and impersonation state claims in the access token only. The OIDC handler will request `openid profile email roles api`, then parse the returned access token and copy the required claims onto the authenticated principal during token validation.

Alternative considered:
- Depend only on the `id_token`.

Why not:
- The `id_token` does not contain `permissions` or `workspace_id`, so it cannot satisfy the access rule or workspace-group provisioning rule.

### 3. Enforce access before Umbraco signs the user in

The token-validation path will reject the sign-in unless the effective claims include either:

- `roles = SUPERADMINISTRATOR`, or
- `permissions = Umbraco.CanManage`

This prevents unauthorized users from being auto-provisioned as usable backoffice users.

Alternative considered:
- Allow provisioning and then block inside Umbraco after login.

Why not:
- That creates unnecessary local users and a weaker backoffice boundary.

### 4. Use Umbraco auto-linking for user creation, plus a provisioning service for local shaping

Umbraco’s auto-linking will create missing local users. A provisioning service will run during auto-link and external-login callbacks to:

- map issuer claims to display name, email, and username
- ensure a workspace-named user group exists
- attach the user to that workspace group
- set root-node access according to the effective authorization level

This keeps user creation inside Umbraco’s supported flow while still letting the project enforce local group and node-access rules.

Alternative considered:
- Fully bypass auto-linking and create/link users manually before Umbraco sees the external identity.

Why not:
- It is more invasive and duplicates built-in Umbraco functionality.

### 5. Represent workspace access with Umbraco user groups named from `workspace_id`

Each effective workspace will map to one Umbraco user group whose name is the effective `workspace_id` claim. The group is created on demand if missing. Non-superadministrator users are assigned this group and receive no root-node access by default.

Alternative considered:
- Store workspace only as a claim and skip Umbraco groups.

Why not:
- Group membership is Umbraco’s native operational model for backoffice access and later manual assignment.

### 6. Model superadministrator root access on the Umbraco user, not by giving every superadmin the built-in admin group

The slice requirement only demands that `SUPERADMINISTRATOR` users can access all root nodes. The provisioning path will set full root-node access for those users via Umbraco user update semantics, while avoiding a broader automatic elevation to every built-in Umbraco section or permission.

Alternative considered:
- Automatically assign the built-in Umbraco admin group.

Why not:
- That grants more capability than this slice requires.

## Risks / Trade-offs

- [Access token parsing depends on issuer JWT shape] -> Mitigation: base the mapping directly on the documented Identity JWT contract and fail closed when required claims are missing.
- [Umbraco callback and provider APIs are version-sensitive] -> Mitigation: use the documented Umbraco 17 external-login extension points and keep the implementation localized to dedicated auth classes.
- [Workspace groups can accumulate if many workspaces are seen over time] -> Mitigation: create them deterministically and idempotently; defer cleanup strategy to a later slice.
- [Existing users may need reshaping when their effective authorization changes] -> Mitigation: run the provisioning service on each external login, not only on initial auto-link.

## Migration Plan

1. Add Umbraco configuration for the Identity issuer, callback path, reserved paths, and redirect-to-login behavior.
2. Add the backoffice external-login provider, principal enrichment, and claim gate.
3. Add provisioning services for workspace groups and Umbraco users.
4. Add the login provider manifest with auto-redirect enabled.
5. Build the project and validate the OpenSpec change.

Rollback:
- Remove the new authentication wiring and manifest files, then restore the previous `Program.cs` and appsettings values.

## Open Questions

- None for this slice. The issuer URL and client credentials were provided, and the access model is explicit.
