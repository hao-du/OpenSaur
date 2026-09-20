# Feature 001: Dynamic Scope Validation & Client Application Permissions

**Status**: Completed  
**Target Release**: `release-001`  
**Description**: Implements dynamic scope validation against OpenIddict registered scopes (`IOpenIddictScopeManager`) and client application permissions (`IOpenIddictApplicationManager`), returning standard `invalid_scope` error when unauthorized.

---

## Task Breakdown & Implementation Checklist

- [x] **Item 1: Create Scope Validation Service (`ScopeValidationService.cs`)**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/Services/ScopeValidationService.cs`
  - Inject `IOpenIddictApplicationManager`.
  - Implement `ValidateScopesAsync(object application, IEnumerable<string> requestedScopes, CancellationToken cancellationToken)`.
  - Check requested scope permissions (`scp:scope_name`) directly on the application.

- [x] **Item 2: Register `ScopeValidationService` in Dependency Injection**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/DependencyInjection/AuthServiceCollectionExtensions.cs`
  - Register `ScopeValidationService` as a scoped service in ASP.NET Core DI container.

- [x] **Item 3: Integrate Client ID & Scope Validation in `AuthorizeHandler.cs`**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/Handlers/OpenIddict/AuthorizeHandler.cs`
  - Validate requesting `client_id` (return `invalid_client` OIDC error if missing or application not found).
  - Retrieve requesting application using `IOpenIddictApplicationManager.FindByClientIdAsync`.
  - Call `ScopeValidationService.ValidateScopesAsync`.
  - If scope validation fails, return `Forbid` with `invalid_scope` OIDC error.

- [x] **Item 4: Integrate Scope Validation in `TokenHandler.cs`**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/Handlers/OpenIddict/TokenHandler.cs`
  - Validate requested scopes during authorization code exchange and refresh token exchange.
  - Return `invalid_scope` error response if unapproved scopes are requested.
