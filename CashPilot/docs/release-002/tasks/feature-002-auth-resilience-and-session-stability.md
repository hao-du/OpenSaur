# Feature 002: Authentication Resilience & Session Stability (Eliminating 401s)

## Description
Users experience unexpected 401 Unauthorized errors during active usage.
Investigation revealed several key factors:
1. **Missing `BaseAddress` on `CashPilotTokenClient`**:
   In `Program.cs`, `builder.Services.AddHttpClient(CashPilotTokenService.HttpClientName)` was registered without setting `client.BaseAddress = new Uri(oidcOptions.Authority)` or prepending authority in `CashPilotTokenService`. As a result, backchannel token refresh fails with an invalid relative URI or network failure!
2. **Premature Session Signout on Single Refresh Failure**:
   In `AuthTokenRefreshCookieEvents.cs`, any failed refresh immediately calls `context.RejectPrincipal()` and signs out the user, even if the current access token has not yet actually expired (it begins attempting refresh 5 minutes before expiration).
3. **Session Store Sliding Expiration**:
   In `UserSessionCookieStore.cs`, `SaveTicketAsync` sets absolute expiration from `ticket.Properties.ExpiresUtc` (which is often short or null), without maintaining sliding expiration across renewals.
4. **Client-Side 401 Handling**:
   When an API returns 401, Axios throws without triggering a clean redirection to `/auth/login?returnUrl=...`.

---

## Tasks

### Item 1: Fix Backchannel Token Client BaseAddress & URL
- [x] Configure `CashPilotTokenClient` in `Program.cs` or `CashPilotTokenService` with `oidcOptions.Authority` so `/connect/token` requests reach the authority endpoint properly (mirroring `CoreGateTokenService` in Zentry).

### Item 2: Make Silent Token Refresh Resilient
- [x] In `AuthTokenRefreshCookieEvents.cs`, do NOT reject the principal if the access token has not actually expired yet (allow graceful retry on subsequent requests instead of instantly kicking the user out).
- [x] Use `ILockService` (scoped by user ID / session key) so multiple simultaneous API requests do not trigger duplicate refresh token calls with the same single-use refresh token across instances.

### Item 3: Session Store Expiration Synchronization
- [x] Ensure `UserSessionCookieStore` maintains the 7-day sliding expiration window on renewals and sets both cookie and cache entry lifetimes consistently.

### Item 4: Frontend 401 Handling via Existing Form & List Error Handlers
- [x] Allow 401 exceptions to propagate directly to existing form/mutation and query error handlers (preserving user input without abrupt redirects).

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.
