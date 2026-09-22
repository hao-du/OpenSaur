# Feature 007: Server-Side User Session Ticket Store

## Description
Implement server-side session storage implementing ASP.NET Core `ITicketStore` named `UserSessionCookieStore`. Store the complete `AuthenticationTicket` (user claims, access_token, id_token, and refresh_token) in distributed memory or Redis cache via `IDistributedCache` and `TicketSerializer`. The browser cookie (`zentry-s`) will only store a lightweight, secure session identifier (e.g. `s_...`), reducing cookie size from >4KB to ~40 bytes and eliminating cookie chunking (`zentry-sC1`, `zentry-sC2`).

---

## Tasks

### Item 1: UserSessionCookieStore Implementation
- [ ] Create `UserSessionCookieStore` implementing `ITicketStore` in `src/OpenSaur.Zentry.Web/Features/Auth/Session`.
- [ ] Implement `UserSessionCookieStore` using `IDistributedCache` with `TicketSerializer.Default` to serialize and deserialize `AuthenticationTicket`.
- [ ] Support sliding expiration and cleanup on `RenewAsync` and `RemoveAsync`.

### Item 2: Cookie Authentication Configuration & Verification
- [ ] Register `ITicketStore` with `UserSessionCookieStore` in DI.
- [ ] Configure `options.SessionStore` via `builder.Services.AddOptions<CookieAuthenticationOptions>(AuthConstants.DefaultCookieScheme).Configure<ITicketStore>(...)` in `Program.cs`.
- [ ] Verify `dotnet build` and `npm run build` succeed.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.

