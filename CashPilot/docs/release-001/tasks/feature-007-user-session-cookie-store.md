# Feature 007: Server-Side User Session Ticket Store

## Description
Implement server-side session storage implementing ASP.NET Core `ITicketStore` named `IUserSessionCookieStore` (`UserSessionCookieStore`). Store the complete `AuthenticationTicket` (user claims, access_token, id_token, and refresh_token) in distributed memory or Redis cache via `IDistributedCache` or `TicketSerializer`. The browser cookie (`cashpilot-s`) will only store a lightweight, secure session identifier (e.g. `s_...`), reducing cookie size from >4KB to ~40 bytes and eliminating cookie chunking (`cashpilot-sC1`, `cashpilot-sC2`).

---

## Tasks

### Item 1: IUserSessionCookieStore Interface & Implementation
- [ ] Create `IUserSessionCookieStore` extending `ITicketStore` in `src/OpenSaur.CashPilot.Web/Features/Auth/Session`.
- [ ] Implement `UserSessionCookieStore` using `IDistributedCache` with `TicketSerializer.Default` to serialize and deserialize `AuthenticationTicket`.
- [ ] Support sliding expiration and cleanup on `RenewAsync` and `RemoveAsync`.

### Item 2: Cookie Authentication Configuration & Verification
- [ ] Register `IUserSessionCookieStore` in DI.
- [ ] Configure `options.SessionStore = app.Services.GetRequiredService<IUserSessionCookieStore>()` in `AddCookie` in `Program.cs`.
- [ ] Verify `dotnet build` and test login flow via browser/curl.
- [ ] Verify browser cookie `cashpilot-s` is a single, small cookie and that chunks (`cashpilot-sC1`, `cashpilot-sC2`) are gone.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.

