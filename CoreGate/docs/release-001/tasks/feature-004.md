# Feature 004: IdentityToken & UserInfo Claims Propagation

**Status**: Completed  
**Target Release**: `release-001`  
**Description**: Configures CoreGate OpenIddict claim destinations and UserInfo endpoint response so that standard OIDC claims (workspace, impersonation context, roles, and profile) are included in the `id_token` and `/connect/userinfo`, allowing client applications (such as Zentry) to automatically populate their local `ClaimsPrincipal` without manual JWT decoding or token validation hooks.

---

## Task Breakdown & Implementation Checklist

- [x] **Item 1: Update Claim Destinations for IdentityToken in `ClaimPrincipalHelpers.cs`**
  - Path: `src/OpenSaur.CoreGate.Web/Infrastructure/Security/ClaimPrincipalHelpers.cs`
  - Ensure `workspace_id`, `workspace_name`, and `impersonation_original_user_id` include `OpenIddictConstants.Destinations.IdentityToken` alongside `AccessToken`.
  - Ensure destination rules align with OpenID Connect specification.

- [x] **Item 2: Update UserInfo Endpoint Payload in `UserInfoHandler.cs`**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/Handlers/OpenIddict/UserInfoHandler.cs`
  - Add `workspace_name` and `impersonation_original_user_id` to `/connect/userinfo` response dictionary if present in the principal.
  - Ensure keys match CoreGate claim types for consistent claim mapping in relying parties.

- [x] **Item 3: Add Permissions Claim Type to IdentityToken and UserInfo Endpoint**
  - Path: `src/OpenSaur.CoreGate.Web/Infrastructure/Security/ClaimPrincipalHelpers.cs` and `src/OpenSaur.CoreGate.Web/Features/Auth/Handlers/OpenIddict/UserInfoHandler.cs`
  - In `ClaimPrincipalHelpers.cs`: Update `ClaimTypes.Permissions` destination to include `OpenIddictConstants.Destinations.IdentityToken` when scope is `"api"`.
  - In `UserInfoHandler.cs`: Include `permissions` array from principal in the `/connect/userinfo` payload if present.


