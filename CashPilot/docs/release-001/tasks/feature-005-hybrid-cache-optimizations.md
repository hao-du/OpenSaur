# Feature 005: Application Cache & Concurrency Lock Optimizations

## Description
Implement the resilient `ICacheService` (wrapping `HybridCache` with `WaitForValueAsync` and L1/L2 lifetime control) and `ILockService` (Memory / Redis Distributed Lock) modeled after Zentry. Expand caching across profile, dashboard calculations, reports, and master data with automated invalidation.

---

## Tasks

### Item 1: CacheService & LockService Implementation
- [x] Create `ICacheService` and `CacheService` (with `GetAsync`, `SetAsync`, `RemoveAsync`, `WaitForValueAsync`, and L1 short expiration).
- [x] Create `ILockService`, `MemoryLockService`, and `RedisDistributedLockService`.
- [x] Register `ICacheService` and `ILockService` in `Program.cs` (connecting Redis if connection string exists, falling back to memory).

### Item 2: Profile Query Caching
- [x] Cache `/api/profile/current` in `CurrentProfileHandler` for 5 minutes per `userId` (`CashPilot:{userId}:profile`).
- [x] Invalidate profile cache when user metadata or settings change.

### Item 3: Dashboard Analytics & Balances Caching
- [x] Cache `/api/transactions/currency-balances` (`GetCurrencyBalancesHandler`) with 60-second TTL per user.
- [x] Cache `/api/transactions/active-bank-balances` (`GetActiveBankBalancesHandler`) with 60-second TTL per user.
- [x] Cache `/api/transactions/marker-periods` (`GetMarkerPeriodsHandler`) and `/api/transactions/income-outcome-by-latest-periods` with 60-second TTL.
- [x] Invalidate user dashboard cache keys upon creation, update, or deletion of `CashFlow`, `BankAccount`, `Transfer`, or `Exchange`.

### Item 4: Reports Query Caching
- [x] Cache `/api/reports/income-outcome` (`GetIncomeOutcomeHandler`) partitioned by `{userId}:{year}:{currencyId}:{tag}` with a 5-minute TTL.
- [x] Invalidate report cache entries when relevant transactions are modified.

### Item 5: Master Data Filter-Aware Cache Keys
- [x] Update cache keys in `GetBanksHandler`, `GetCurrenciesHandler`, `GetCounterpartiesHandler`, and `GetTagsHandler` to incorporate filter parameters (`name`, `shortName`, `isActive`) so filtered searches do not return unfiltered cached results.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.
