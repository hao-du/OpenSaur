# Feature 003: Hybrid Cache & Multi-Node Concurrency Locking

## Description
Prevent concurrent duplicate token refresh calls to CoreGate during high-concurrency or multi-tab SPA scenarios using .NET `HybridCache` for two-tier (L1 in-memory + L2 distributed) caching and a pluggable lock service (`MemoryLockService` for single-node development, `RedisDistributedLockService` with atomic `SET NX` for multi-node deployments).

---

## Tasks

### Item 1: Hybrid Cache Setup & CacheService
- [x] Add `.NET HybridCache` package (`Microsoft.Extensions.Caching.Hybrid`) and register `AddHybridCache()` in `Program.cs`.
- [x] Define `ICacheService` and `CacheService` encapsulating `HybridCache` for simple caching, cache keys, and serialized session storage.
- [x] Configure pluggable L2 distributed backend (in-memory distributed cache when Redis connection string is empty, StackExchange.Redis when present).

### Item 2: Pluggable Lock Services (Memory vs Redis Distributed)
- [x] Define `ILockService` interface with `TryAcquireLockAsync(string lockKey, TimeSpan timeout, CancellationToken ct)` and `ReleaseLockAsync(string lockKey, CancellationToken ct)`.
- [x] Implement `MemoryLockService` using thread-safe in-memory primitives for single-node scenarios.
- [x] Implement `RedisDistributedLockService` using StackExchange.Redis atomic `StringSetAsync(..., When.NotExists)` and release for multi-node deployments.
- [x] Register `ILockService` conditionally in `Program.cs` based on whether `ConnectionStrings:Redis` is configured.

### Item 3: Refresh Coordination in BffTokenRefreshCookieEvents
- [x] Inject `ICacheService` and `ILockService` into `BffTokenRefreshCookieEvents`.
- [x] Coordinate silent token refresh: check cached session, acquire lock, coordinate waiting parallel requests, persist refreshed tokens to cache, and safely release lock.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[x]` will only be marked upon manual review and approval.
