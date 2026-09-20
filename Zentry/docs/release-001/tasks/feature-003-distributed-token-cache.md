# Feature 003: Distributed Token Cache & Concurrency Lock

## Description
Prevent concurrent duplicate token refresh calls to CoreGate during high-concurrency or multi-tab SPA scenarios using `IDistributedCache` (in-memory for local development, extending cleanly to Redis for multi-instance deployments).

---

## Tasks

### Item 1: Distributed Cache Infrastructure Setup
- [ ] Register `IDistributedCache` in `Program.cs` (`AddDistributedMemoryCache` for local, pluggable for Redis).
- [ ] Define cache key constants and serialization helper for token session storage.

### Item 2: Distributed Lock & Refresh Coordination
- [ ] Implement short-lived distributed lock during refresh (`lock:refresh:{userId}`).
- [ ] When lock is held, parallel requests wait and read the refreshed token from cache.
- [ ] Release lock upon refresh completion or failure.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[x]` will only be marked upon manual review and approval.

