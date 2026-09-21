# Feature 006: HybridCache Integration & Performance Optimization

**Status**: Completed  
**Target Release**: `release-001`  
**Description**: Integrates .NET 10 HybridCache (L1 Memory + L2 Redis) with automatic distributed memory fallback to optimize hot authentication queries (user roles, permissions, workspaces, client scopes).

---

## Task Breakdown & Implementation Checklist

- [x] **Item 1: Add HybridCache & Redis NuGet Packages**
  - Path: `src/OpenSaur.CoreGate.Web/OpenSaur.CoreGate.Web.csproj`
  - Add `Microsoft.Extensions.Caching.Hybrid` (v10.10.0), `Microsoft.Extensions.Caching.StackExchangeRedis` (v10.0.12), and `StackExchange.Redis` (v3.3.0).

- [x] **Item 2: Register HybridCache and Redis / Memory Fallback in DI**
  - Path: `src/OpenSaur.CoreGate.Web/Infrastructure/DependencyInjection/CacheServiceCollectionExtensions.cs` & `Program.cs`
  - Read `ConnectionStrings:Redis`. If configured, register Redis connection and `AddStackExchangeRedisCache`. Otherwise, register `AddDistributedMemoryCache()`.
  - Register `AddHybridCache()` with global default expiration policies.

- [x] **Item 3: Cache User Roles, Permissions & Impersonation Check in `UserRolePermissionService`**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/Services/UserRolePermissionService.cs`
  - Inject `HybridCache`.
  - Use `GetOrCreateAsync` for `GetActiveNormalizedRoleNamesForUserAsync`, `GetGrantedPermissionCodesAsync`, and `CanImpersonateAsync`.

- [x] **Item 4: Cache Active Workspace Metadata in `ClaimService`**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/Services/ClaimService.cs`
  - Inject `HybridCache`.
  - Use `GetOrCreateAsync` when resolving user's home workspace and assigned workspace.

- [x] **Item 5: Cache Client Permissions in `ScopeValidationService`**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/Services/ScopeValidationService.cs`
  - Inject `HybridCache`.
  - Use `GetOrCreateAsync` when querying client application permissions from OpenIddict.

- [x] **Item 6: Tune L1 Local Cache Expiration to Mitigate Multi-Node Staleness**
  - Path: `src/OpenSaur.CoreGate.Web/Infrastructure/DependencyInjection/CacheServiceCollectionExtensions.cs`, `UserRolePermissionService.cs`, `ClaimService.cs`, `ScopeValidationService.cs`
  - Set `LocalCacheExpiration` to 30 seconds for in-memory L1 to minimize cross-node discrepancy window without unnecessary multiplexer overhead, while keeping distributed L2 (Redis) at 5–10 minutes.

