# Feature 007: Server-Side User Session Ticket Store

## Description
Implement server-side session storage implementing ASP.NET Core `ITicketStore` named `IUserSessionCookieStore` (`UserSessionCookieStore`). Store the complete `AuthenticationTicket` (user claims, access_token, id_token, and refresh_token) in distributed memory or Redis cache via `IDistributedCache` or `TicketSerializer`. The browser cookie (`cashpilot-s`) will only store a lightweight, secure session identifier (e.g. `s_...`), reducing cookie size from >4KB to ~40 bytes and eliminating cookie chunking (`cashpilot-sC1`, `cashpilot-sC2`).

---

## Tasks

### Item 1: UserSessionCookieStore (ITicketStore) Implementation
- [x] Implement `UserSessionCookieStore` using `ITicketStore` and `IDistributedCache` with `TicketSerializer.Default` to serialize and deserialize `AuthenticationTicket`.
- [x] Support sliding expiration and cleanup on `RenewAsync` and `RemoveAsync`.

### Item 2: Cookie Authentication Configuration & Verification
- [x] Register `ITicketStore` and `UserSessionCookieStore` in DI.
- [x] Configure `options.SessionStore` via `AddOptions<CookieAuthenticationOptions>()` in `Program.cs`.
- [x] Verify `dotnet build` and test login flow via browser/curl.
- [x] Verify browser cookie `cashpilot-s` is a single, small cookie and that chunks (`cashpilot-sC1`, `cashpilot-sC2`) are gone.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.

