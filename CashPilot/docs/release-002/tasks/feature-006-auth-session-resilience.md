# Feature 006: Auth Session Resilience & Token Refresh Coordination

## Description
Eliminate unexpected 401s by:
1. Fixing `UserSessionCookieStore` so Redis session keys do not prematurely expire when CoreGate's short access token (15 minutes) expires, maintaining the true 7-day sliding session.
2. Porting Zentry's token refresh coordination (`CachedTokenSession` + `WaitForValueAsync`) into `AuthTokenRefreshCookieEvents` so concurrent parallel requests wait for the active refresh to complete instead of aborting the session.

---

## Tasks

### Item 1: Fix UserSessionCookieStore Redis Sliding Expiration
- [x] In `UserSessionCookieStore.cs`, remove `AbsoluteExpiration` truncation to `ticket.Properties.ExpiresUtc`.
- [x] Enforce true 7-day sliding expiration (`DefaultSlidingExpiration = TimeSpan.FromDays(7)`) across creation and renewals.

### Item 2: Port Zentry Parallel Token Refresh Coordination
- [x] Add `CachedTokenSession` model and `CacheKeys.TokenSession(userId)` helper.
- [x] In `AuthTokenRefreshCookieEvents.cs`, check `cacheService` for an already-refreshed session before acquiring lock.
- [x] If lock is held by another request, call `cacheService.WaitForValueAsync<CachedTokenSession>()` to await the new tokens.
- [x] Save new tokens to `cacheService` upon successful refresh, preventing duplicate refresh attempts and premature session sign-outs.
- [x] Verify `dotnet build` and test parallel request handling.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.
