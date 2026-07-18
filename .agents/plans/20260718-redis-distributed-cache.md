# Redis Distributed Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Redis as the distributed cache layer to the existing Hybrid Cache setup (keeping in-memory as the local layer)

**Architecture:** The current `AddHybridCache()` uses MemoryCache as the default distributed layer. We'll register `StackExchangeRedisCache` as the `IDistributedCache` implementation before calling `AddHybridCache()`, which will automatically use Redis for the distributed layer while keeping MemoryCache for the local layer.

**Tech Stack:**
- `Microsoft.Extensions.Caching.StackExchangeRedis` v9.3.0
- Redis connection string via `ConnectionStrings:Redis` in appsettings
- Existing `IHybridCacheService` abstraction — no changes needed

## Global Constraints

- Target framework: net10.0
- No tests required (per project rules)
- No auto-commit unless explicitly requested
- Follow Memory Workflow: read AGENTS.md, discover files, read required files before implementation
- Pre-Edit Verification: always read before writing
- Minimal changes only — no wholesale rewrites

---

### Task 1: Add NuGet Package

**Files:**
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\OpenSaur.CashPilot.Web.csproj`

**Interfaces:**
- Consumes: none
- Produces: `Microsoft.Extensions.Caching.StackExchangeRedis` package available

- [ ] **Step 1: Add StackExchangeRedis package reference**

Append the following package reference to the `<ItemGroup>` in the csproj (after line 22, the existing HybridCache reference):

```xml
<PackageReference Include="Microsoft.Extensions.Caching.StackExchangeRedis" Version="9.3.0" />
```

- [ ] **Step 2: Verify the csproj**

Read `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\OpenSaur.CashPilot.Web.csproj` to confirm the package reference was added correctly.

---

### Task 2: Add Redis Connection String to Configuration

**Files:**
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\appsettings.json` (development)
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\appsettings.Production.json` (production)

**Interfaces:**
- Consumes: none
- Produces: `ConnectionStrings:Redis` available in configuration

- [ ] **Step 1: Add Redis connection string to appsettings.json**

In `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\appsettings.json`, add a new `Redis` entry to the existing `ConnectionStrings` object (after line 3):

```json
"Redis": "localhost:6379"
```

The full `ConnectionStrings` section should look like:
```json
"ConnectionStrings": {
  "CashPilotDb": "Host=localhost;Database=cashpilot;Username=postgres;Password=postgres",
  "Redis": "localhost:6379"
}
```

- [ ] **Step 2: Add Redis connection string to appsettings.Production.json**

In `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\appsettings.Production.json`, add a `ConnectionStrings` section with Redis (after line 18, before the closing brace):

```json
"ConnectionStrings": {
  "Redis": "redis-host:6379"
}
```

Note: The production Redis host should be updated to the actual Redis server address when deployed.

- [ ] **Step 3: Verify both files**

Read both `appsettings.json` and `appsettings.Production.json` to confirm the connection strings were added correctly.

---

### Task 3: Wire Redis into DI

**Files:**
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Program.cs`

**Interfaces:**
- Consumes: `IConfiguration` from `builder.Configuration`, `IDistributedCache` service
- Produces: Redis-backed distributed cache registered in DI, HybridCache using Redis as distributed layer

- [ ] **Step 1: Add using statement for Redis cache**

Add the following using statement at the top of `Program.cs` (after line 24, before line 25):

```csharp
using Microsoft.Extensions.Caching.StackExchangeRedis;
```

- [ ] **Step 2: Register StackExchangeRedisCache before AddHybridCache**

In `Program.cs`, replace the existing `AddHybridCache()` call (line 90) with:

```csharp
// Register Redis as the distributed cache
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    options.InstancePrefix = "CashPilot:";
});

// HybridCache now uses Redis for distributed layer + MemoryCache for local layer
builder.Services.AddHybridCache();
```

The key point: `AddHybridCache()` automatically picks up any registered `IDistributedCache` implementation. By registering `AddStackExchangeRedisCache()` first, Redis becomes the distributed layer.

- [ ] **Step 3: Verify Program.cs**

Read `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Program.cs` lines 85-95 to confirm:
- The `using` statement for `StackExchangeRedis` is present
- `AddStackExchangeRedisCache()` is called before `AddHybridCache()`
- Both registrations are in the correct order

---

### Task 4: Build Verification

**Files:**
- Build: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web`

**Interfaces:**
- Consumes: all previous tasks
- Produces: verified working build

- [ ] **Step 1: Run dotnet build**

Run from `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web`:
```bash
dotnet build
```

Expected: Build succeeds with 0 errors

- [ ] **Step 2: Verify build output**

Check the build output for any errors. Report the result.

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Add StackExchangeRedis package | `OpenSaur.CashPilot.Web.csproj` |
| 2 | Add Redis connection string | `appsettings.json`, `appsettings.Production.json` |
| 3 | Wire Redis into DI | `Program.cs` |
| 4 | Build verification | `dotnet build` |

**How it works:**
- `AddHybridCache()` automatically detects registered `IDistributedCache` implementations
- By registering `AddStackExchangeRedisCache()` first, Redis becomes the distributed layer
- `MemoryCache` remains the local (in-memory) layer
- Result: **hybrid cache** — first checks local MemoryCache, then Redis, then falls back to the database factory

**Plan complete and saved to `.agents/plans/20260718-redis-distributed-cache.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
