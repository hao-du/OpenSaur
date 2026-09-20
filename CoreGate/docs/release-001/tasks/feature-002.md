# Feature 002: Machine-to-Machine (M2M) Client Credentials Flow

**Status**: Completed  
**Target Release**: `release-001`  
**Description**: Implements OAuth 2.0 `grant_type=client_credentials` support for server-to-server and Backend-For-Frontend (BFF) authentication without user context.

---

## Task Breakdown & Implementation Checklist

- [x] **Item 1: Enable Client Credentials Flow in Server Configuration**
  - Path: `src/OpenSaur.CoreGate.Web/Infrastructure/DependencyInjection/OpenIddictServiceCollectionExtensions.cs`
  - Add `options.AllowClientCredentialsFlow();` to OpenIddict server options builder.

- [x] **Item 2: Add M2M Grant Type Support in `TokenHandler.cs`**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/Handlers/OpenIddict/TokenHandler.cs`
  - Update grant type check to allow `request.IsClientCredentialsGrantType()`.
  - Validate client credentials via OpenIddict server authentication context.

- [x] **Item 3: Implement M2M Claims Principal Builder in `ClaimService.cs`**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/Services/ClaimService.cs`
  - Add `BuildClientClaimPrincipalAsync(object application, IEnumerable<string> grantedScopes, CancellationToken cancellationToken)`.
  - Set `sub` to `client_id` (e.g. `"bff-portal"`), set `client_id`, and attach allowed application permissions and scopes.

- [x] **Item 4: Issue M2M Access Token in `TokenHandler.cs`**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/Handlers/OpenIddict/TokenHandler.cs`
  - Call `BuildClientClaimPrincipalAsync` when handling client credentials flow.
  - Return `Results.SignIn(principal, authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme)`.
