# Feature 007: Server-Side User Session Ticket Store

**Status**: In Progress  
**Target Release**: `release-001`  
**Description**: Implements server-side session ticket storage implementing ASP.NET Core `ITicketStore` (`UserSessionCookieStore`). Stores serialized `AuthenticationTicket` (user claims and session metadata) in distributed cache (Redis or MemoryCache via `IDistributedCache`). The browser cookie (`coregate-s`) only holds a small session ID (`s_...`), shrinking cookie payload from >4KB to ~40 bytes and eliminating cookie chunking (`coregate-sC1`, `coregate-sC2`).

---

## Task Breakdown & Implementation Checklist

- [ ] **Item 1: Implement `UserSessionCookieStore` (`ITicketStore`) and Session Cache Key**
  - Path: `src/OpenSaur.CoreGate.Web/Infrastructure/Security/UserSessionCookieStore.cs`, `Infrastructure/Caching/CacheKeys.cs`
  - Implement `ITicketStore` with `StoreAsync`, `RenewAsync`, `RetrieveAsync`, and `RemoveAsync` using `IDistributedCache` and `TicketSerializer.Default`.
  - Add session cache key helper in `CacheKeys.cs`.

- [ ] **Item 2: Register `UserSessionCookieStore` in DI and `ConfigureApplicationCookie`**
  - Path: `src/OpenSaur.CoreGate.Web/Infrastructure/DependencyInjection/OpenIddictServiceCollectionExtensions.cs`
  - Register `UserSessionCookieStore` as singleton in DI.
  - Set `options.SessionStore` in `ConfigureApplicationCookie(...)`.
  - Verify C# compilation with 0 errors.

