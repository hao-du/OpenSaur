# Hybrid Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ASP.NET Hybrid Cache to cache Banks, Currencies, Counterparties, Tags, and Templates data with 5-minute TTL.

**Architecture:** Create a shared `IHybridCacheService` abstraction in `Infrastructure/Caching/` that wraps `Microsoft.Extensions.Caching.Hybrid.HybridCache`. Register it in DI via `Program.cs`. Wrap the 5 read endpoints (GetBanks, GetCurrencies, GetCounterparties, GetTags, GetTemplates) with cache lookups — check cache first, fall back to DB on miss, write to cache on hit.

**Tech Stack:** .NET 10, ASP.NET Core Hybrid Cache (`Microsoft.Extensions.Caching.Hybrid`), EF Core with Npgsql, PostgreSQL, CQRS handlers.

## Global Constraints

- **Framework**: `Microsoft.Extensions.Caching.Hybrid` package for hybrid caching (in-memory + distributed).
- **TTL**: 5 minutes for all cached keys.
- **Cache keys**: Scoped by user (`{feature}:{userId}`) to ensure data isolation.
- **No breaking changes**: Existing endpoints must continue to work identically; caching is transparent.
- **Caching scope**: Only GET/read endpoints. No caching of create/update/delete operations.

---

### Task 1: Add Hybrid Cache Package

**Files:**
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\OpenSaur.CashPilot.Web.csproj`

**Interfaces:**
- Produces: `Microsoft.Extensions.Caching.Hybrid` package reference available for DI registration.

- [ ] **Step 1: Add package reference**

Append the following `<PackageReference>` inside the existing `<ItemGroup>` in the csproj:

```xml
    <PackageReference Include="Microsoft.Extensions.Caching.Hybrid" Version="9.3.0" />
```

- [ ] **Step 2: Verify csproj**

Read `OpenSaur.CashPilot.Web.csproj` to confirm the package reference is correctly placed inside the `<ItemGroup>`.

---

### Task 2: Create HybridCacheService Abstraction

**Files:**
- Create: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Infrastructure\Caching\IHybridCacheService.cs`
- Create: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Infrastructure\Caching\HybridCacheService.cs`

**Interfaces:**
- Consumes: `Microsoft.Extensions.Caching.Hybrid.HybridCache` from DI.
- Produces: `IHybridCacheService` with `GetOrCreateAsync<T>(string key, Func<string, Task<T>> factory, TimeSpan? expiresIn = null)` and `RemoveAsync(string key)`.

- [ ] **Step 1: Create IHybridCacheService interface**

Create `IHybridCacheService.cs` with:

```csharp
namespace OpenSaur.CashPilot.Web.Infrastructure.Caching;

public interface IHybridCacheService
{
    Task<T?> GetOrCreateAsync<T>(string key, Func<string, Task<T>> factory, TimeSpan? expiresIn = null);
    Task RemoveAsync(string key);
}
```

- [ ] **Step 2: Create HybridCacheService implementation**

Create `HybridCacheService.cs` with:

```csharp
using Microsoft.Extensions.Caching.Hybrid;

namespace OpenSaur.CashPilot.Web.Infrastructure.Caching;

public sealed class HybridCacheService(HybridCache hybridCache) : IHybridCacheService
{
    public async Task<T?> GetOrCreateAsync<T>(string key, Func<string, Task<T>> factory, TimeSpan? expiresIn = null)
    {
        return await hybridCache.GetOrCreateAsync(
            key,
            async (ctx) => await factory(key),
            expiresIn);
    }

    public Task RemoveAsync(string key)
    {
        hybridCache.Remove(key);
        return Task.CompletedTask;
    }
}
```

- [ ] **Step 3: Verify files**

Read both files to confirm content matches.

---

### Task 3: Register Hybrid Cache in DI (Program.cs)

**Files:**
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Program.cs`

**Interfaces:**
- Consumes: Nothing new.
- Produces: `IHybridCacheService` registered as singleton in DI; `HybridCache` configured with 5-minute default TTL.

- [ ] **Step 1: Add using directive**

Add below the existing `using` statements (after `using OpenSaur.CashPilot.Web.Infrastructure.Hosting;`):

```csharp
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
```

- [ ] **Step 2: Register HybridCache and IHybridCacheService**

Add below `builder.Services.AddProblemDetails();`:

```csharp
builder.Services.AddHybridCache();
builder.Services.AddSingleton<IHybridCacheService, HybridCacheService>();
```

- [ ] **Step 3: Verify Program.cs**

Read `Program.cs` lines 85-95 to confirm the registration is correctly placed before `builder.Build()`.

---

### Task 4: Cache Banks Endpoint

**Files:**
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Banks\Handlers\GetBanksHandler.cs`

**Interfaces:**
- Consumes: `IHybridCacheService` as new parameter on `HandleAsync`.
- Produces: Cached `IReadOnlyList<BankResponse>` keyed by `{banks}:{userId}`.

- [ ] **Step 1: Add using and cache parameter**

Add below `using OpenSaur.CashPilot.Web.Infrastructure.Helpers;`:

```csharp
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
```

Add `IHybridCacheService cache` parameter after `ClaimsPrincipal user`:

```csharp
ClaimsPrincipal user,
IHybridCacheService cache,
CashPilotDbContext dbContext,
```

- [ ] **Step 2: Wrap query with cache**

Replace the entire method body. Find the line `var currentUserId = ClaimHelper.GetCurrentUserId(user);` and the following query block. Replace from that point through the `return TypedResults.Ok...` line with:

```csharp
var currentUserId = ClaimHelper.GetCurrentUserId(user);
var cacheKey = $"banks:{currentUserId}";

var result = await cache.GetOrCreateAsync(
    cacheKey,
    async (key) =>
    {
        var activeFilter = isActive ?? true;
        var query = dbContext.Banks
            .AsNoTracking()
            .Where(bank => bank.OwnerId == currentUserId && bank.IsActive == activeFilter);

        if (!string.IsNullOrWhiteSpace(normalizedName))
        {
            query = query.Where(bank => EF.Functions.ILike(bank.Name, $"%{normalizedName}%"));
        }

        if (!string.IsNullOrWhiteSpace(normalizedShortName))
        {
            query = query.Where(bank => EF.Functions.ILike(bank.ShortName, $"%{normalizedShortName}%"));
        }

        return await query
            .OrderByDescending(bank => bank.IsDefault)
            .ThenBy(bank => bank.ShortName)
            .Select(bank => new BankResponse(
                bank.Id,
                bank.Name,
                bank.ShortName,
                bank.Description,
                bank.IsDefault
            ))
            .ToListAsync(cancellationToken);
    },
    TimeSpan.FromMinutes(5));

return TypedResults.Ok<IReadOnlyList<BankResponse>>(result);
```

- [ ] **Step 3: Verify**

Read `GetBanksHandler.cs` to confirm the cache logic is correctly integrated.

---

### Task 5: Cache Currencies Endpoint

**Files:**
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Currencies\Handlers\GetCurrenciesHandler.cs`

**Interfaces:**
- Consumes: `IHybridCacheService` as new parameter.
- Produces: Cached `IReadOnlyList<CurrencyResponse>` keyed by `{currencies}:{userId}`.

- [ ] **Step 1: Add using and cache parameter**

Add below `using OpenSaur.CashPilot.Web.Infrastructure.Helpers;`:

```csharp
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
```

Add `IHybridCacheService cache` parameter after `ClaimsPrincipal user`:

```csharp
ClaimsPrincipal user,
IHybridCacheService cache,
CashPilotDbContext dbContext,
```

- [ ] **Step 2: Wrap query with cache**

Find `var currentUserId = ClaimHelper.GetCurrentUserId(user);` through the `return TypedResults.Ok...` line. Replace with:

```csharp
var currentUserId = ClaimHelper.GetCurrentUserId(user);
var cacheKey = $"currencies:{currentUserId}";

var result = await cache.GetOrCreateAsync(
    cacheKey,
    async (key) =>
    {
        var activeFilter = isActive ?? true;
        var query = dbContext.Currencies
            .AsNoTracking()
            .Where(currency => currency.OwnerId == currentUserId && currency.IsActive == activeFilter);

        if (!string.IsNullOrWhiteSpace(normalizedName))
        {
            query = query.Where(currency => EF.Functions.ILike(currency.Name, $"%{normalizedName}%"));
        }

        if (!string.IsNullOrWhiteSpace(normalizedShortName))
        {
            query = query.Where(currency => EF.Functions.ILike(currency.ShortName, $"%{normalizedShortName}%"));
        }

        return await query
            .OrderByDescending(currency => currency.IsDefault)
            .ThenBy(currency => currency.ShortName)
            .Select(currency => new CurrencyResponse(
                currency.Id,
                currency.Name,
                currency.ShortName,
                currency.Description,
                currency.IsDefault
            ))
            .ToListAsync(cancellationToken);
    },
    TimeSpan.FromMinutes(5));

return TypedResults.Ok<IReadOnlyList<CurrencyResponse>>(result);
```

- [ ] **Step 3: Verify**

Read `GetCurrenciesHandler.cs` to confirm correctness.

---

### Task 6: Cache Counterparties Endpoint

**Files:**
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Counterparties\Handlers\GetCounterpartiesHandler.cs`

**Interfaces:**
- Consumes: `IHybridCacheService` as new parameter.
- Produces: Cached `IReadOnlyList<CounterpartyResponse>` keyed by `{counterparties}:{userId}`.

- [ ] **Step 1: Add using and cache parameter**

Add below `using OpenSaur.CashPilot.Web.Infrastructure.Helpers;`:

```csharp
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
```

Add `IHybridCacheService cache` parameter after `ClaimsPrincipal user`:

```csharp
ClaimsPrincipal user,
IHybridCacheService cache,
CashPilotDbContext dbContext,
```

- [ ] **Step 2: Wrap query with cache**

Find `var currentUserId = ClaimHelper.GetCurrentUserId(user);` through the `return TypedResults.Ok...` line. Replace with:

```csharp
var currentUserId = ClaimHelper.GetCurrentUserId(user);
var cacheKey = $"counterparties:{currentUserId}";

var result = await cache.GetOrCreateAsync(
    cacheKey,
    async (key) =>
    {
        var activeFilter = isActive ?? true;
        var query = dbContext.Counterparties
            .AsNoTracking()
            .Where(counterparty => counterparty.OwnerId == currentUserId && counterparty.IsActive == activeFilter);

        if (!string.IsNullOrWhiteSpace(normalizedFullName))
        {
            query = query.Where(counterparty => EF.Functions.ILike(counterparty.FullName, $"%{normalizedFullName}%"));
        }

        if (!string.IsNullOrWhiteSpace(normalizedEmail))
        {
            query = query.Where(counterparty => counterparty.Email != null && EF.Functions.ILike(counterparty.Email, $"%{normalizedEmail}%"));
        }

        if (!string.IsNullOrWhiteSpace(normalizedPhoneNumber))
        {
            query = query.Where(counterparty => counterparty.PhoneNumber != null && EF.Functions.ILike(counterparty.PhoneNumber, $"%{normalizedPhoneNumber}%"));
        }

        return await query
            .OrderByDescending(counterparty => counterparty.IsDefault)
            .ThenBy(counterparty => counterparty.FullName)
            .Select(counterparty => new CounterpartyResponse(
                counterparty.Id,
                counterparty.FullName,
                counterparty.Email,
                counterparty.PhoneNumber,
                counterparty.Description,
                counterparty.IsDefault,
                counterparty.IsActive
            ))
            .ToListAsync(cancellationToken);
    },
    TimeSpan.FromMinutes(5));

return TypedResults.Ok<IReadOnlyList<CounterpartyResponse>>(result);
```

- [ ] **Step 3: Verify**

Read `GetCounterpartiesHandler.cs` to confirm correctness.

---

### Task 7: Cache Tags Endpoint

**Files:**
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Tags\Handlers\GetTagsHandler.cs`

**Interfaces:**
- Consumes: `IHybridCacheService` as new parameter.
- Produces: Cached `IReadOnlyList<TagDefinitionResponse>` keyed by `{tags}:{userId}`.

- [ ] **Step 1: Add using and cache parameter**

Add below `using OpenSaur.CashPilot.Web.Infrastructure.Helpers;`:

```csharp
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
```

Add `IHybridCacheService cache` parameter after `ClaimsPrincipal user`:

```csharp
ClaimsPrincipal user,
IHybridCacheService cache,
CashPilotDbContext dbContext,
```

- [ ] **Step 2: Wrap query with cache**

Find `var currentUserId = ClaimHelper.GetCurrentUserId(user);` through the `return TypedResults.Ok...` line. Replace with:

```csharp
var currentUserId = ClaimHelper.GetCurrentUserId(user);
var cacheKey = $"tags:{currentUserId}";

var result = await cache.GetOrCreateAsync(
    cacheKey,
    async (key) =>
    {
        var query = dbContext.TagDefinitions
            .AsNoTracking()
            .Where(x => x.OwnerId == currentUserId);
        
        if (isActive.HasValue)
        {
            query = query.Where(x => x.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(name))
        {
            var normalizedName = name.Trim();
            query = query.Where(x => x.Name.Contains(normalizedName));
        }

        return await query.OrderBy(x => x.Name)
            .Select(x => new TagDefinitionResponse(
                x.Id,
                x.Name,
                TagTermCodec.Decode(x.MatchingTerms),
                x.IsActive,
                x.Marker,
                x.IsDefaultMaker))
            .ToListAsync(cancellationToken);
    },
    TimeSpan.FromMinutes(5));

return TypedResults.Ok<IReadOnlyList<TagDefinitionResponse>>(result);
```

- [ ] **Step 3: Verify**

Read `GetTagsHandler.cs` to confirm correctness.

---

### Task 8: Cache Templates Endpoint

**Files:**
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Templates\Handlers\GetTemplatesHandler.cs`

**Interfaces:**
- Consumes: `IHybridCacheService` as new parameter.
- Produces: Cached `IReadOnlyList<TemplateListItemResponse>` keyed by `{templates}:{userId}`.

- [ ] **Step 1: Add using and cache parameter**

Add below `using OpenSaur.CashPilot.Web.Infrastructure.Helpers;`:

```csharp
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
```

Add `IHybridCacheService cache` parameter after `ClaimsPrincipal user`:

```csharp
ClaimsPrincipal user,
IHybridCacheService cache,
CashPilotDbContext dbContext,
```

- [ ] **Step 2: Wrap query with cache**

Find `var currentUserId = ClaimHelper.GetCurrentUserId(user);` through the `return TypedResults.Ok...` line. Replace with:

```csharp
var currentUserId = ClaimHelper.GetCurrentUserId(user);
var cacheKey = $"templates:{currentUserId}";

var result = await cache.GetOrCreateAsync(
    cacheKey,
    async (key) =>
    {
        var activeFilter = isActive ?? true;
        var query = dbContext.Templates
            .AsNoTracking()
            .Where(template => template.OwnerId == currentUserId && template.IsActive == activeFilter);

        if (!string.IsNullOrWhiteSpace(normalizedName))
        {
            query = query.Where(template => EF.Functions.ILike(template.Name, $"%{normalizedName}%"));
        }

        if (templateType.HasValue)
        {
            query = query.Where(template => template.TemplateType == templateType.Value);
        }

        return await query
            .OrderBy(template => template.TemplateType)
            .ThenBy(template => template.Name)
            .Select(template => new TemplateListItemResponse(
                template.Id,
                template.Name,
                template.Description,
                template.TemplateType,
                getDetail ? template.TemplateDataJson : null,
                template.IsActive))
            .ToListAsync(cancellationToken);
    },
    TimeSpan.FromMinutes(5));

return TypedResults.Ok<IReadOnlyList<TemplateListItemResponse>>(result);
```

- [ ] **Step 3: Verify**

Read `GetTemplatesHandler.cs` to confirm correctness.

---

### Task 9: Invalidate Cache on Mutations (Banks)

**Files:**
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Banks\Handlers\CreateBankHandler.cs`
- Modify: `D:\OpenSaur\CashPilot.Web\Features\Banks\Handlers\UpdateBankHandler.cs`
- Modify: `D:\OpenSaur\CashPilot.Web\Features\Banks\Handlers\DeleteBankHandler.cs`

**Interfaces:**
- Consumes: `IHybridCacheService` to invalidate `banks:{userId}` cache key.
- Produces: Bank mutations now clear the associated user's bank cache.

- [ ] **Step 1: Add IHybridCacheService to CreateBankHandler**

In `CreateBankHandler.cs`, add `IHybridCacheService cache` as a parameter and after the bank is created, add:

```csharp
await cache.RemoveAsync($"banks:{currentUserId}");
```

- [ ] **Step 2: Add IHybridCacheService to UpdateBankHandler**

In `UpdateBankHandler.cs`, add `IHybridCacheService cache` as a parameter and after the bank is updated, add:

```csharp
await cache.RemoveAsync($"banks:{currentUserId}");
```

- [ ] **Step 3: Add IHybridCacheService to DeleteBankHandler**

In `DeleteBankHandler.cs`, add `IHybridCacheService cache` as a parameter and after the bank is deleted, add:

```csharp
await cache.RemoveAsync($"banks:{currentUserId}");
```

- [ ] **Step 4: Verify**

Read all three handlers to confirm cache invalidation is in place.

---

### Task 10: Invalidate Cache on Mutations (Currencies)

**Files:**
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Currencies\Handlers\CreateCurrencyHandler.cs`
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Currencies\Handlers\UpdateCurrencyHandler.cs`
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Currencies\Handlers\DeleteCurrencyHandler.cs`

**Interfaces:**
- Consumes: `IHybridCacheService` to invalidate `currencies:{userId}` cache key.

- [ ] **Step 1: Add cache invalidation to all 3 handlers**

In each handler, add `IHybridCacheService cache` parameter and after the mutation completes:

```csharp
await cache.RemoveAsync($"currencies:{currentUserId}");
```

- [ ] **Step 2: Verify**

Read all three handlers to confirm.

---

### Task 11: Invalidate Cache on Mutations (Counterparties)

**Files:**
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Counterparties\Handlers\CreateCounterpartyHandler.cs`
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Counterparties\Handlers\UpdateCounterpartyHandler.cs`
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Counterparties\Handlers\DeleteCounterpartyHandler.cs`

**Interfaces:**
- Consumes: `IHybridCacheService` to invalidate `counterparties:{userId}` cache key.

- [ ] **Step 1: Add cache invalidation to all 3 handlers**

In each handler, add `IHybridCacheService cache` parameter and after the mutation:

```csharp
await cache.RemoveAsync($"counterparties:{currentUserId}");
```

- [ ] **Step 2: Verify**

Read all three handlers to confirm.

---

### Task 12: Invalidate Cache on Mutations (Tags)

**Files:**
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Tags\Handlers\CreateTagHandler.cs`
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Tags\Handlers\UpdateTagHandler.cs`
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Tags\Handlers\DeleteTagHandler.cs`

**Interfaces:**
- Consumes: `IHybridCacheService` to invalidate `tags:{userId}` cache key.

- [ ] **Step 1: Add cache invalidation to all 3 handlers**

In each handler, add `IHybridCacheService cache` parameter and after the mutation:

```csharp
await cache.RemoveAsync($"tags:{currentUserId}");
```

- [ ] **Step 2: Verify**

Read all three handlers to confirm.

---

### Task 13: Invalidate Cache on Mutations (Templates)

**Files:**
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Templates\Handlers\CreateTemplateHandler.cs`
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Templates\Handlers\UpdateTemplateHandler.cs`
- Modify: `D:\OpenSaur\CashPilot\src\OpenSaur.CashPilot.Web\Features\Templates\Handlers\DeleteTemplateHandler.cs`

**Interfaces:**
- Consumes: `IHybridCacheService` to invalidate `templates:{userId}` cache key.

- [ ] **Step 1: Add cache invalidation to all 3 handlers**

In each handler, add `IHybridCacheService cache` parameter and after the mutation:

```csharp
await cache.RemoveAsync($"templates:{currentUserId}");
```

- [ ] **Step 2: Verify**

Read all three handlers to confirm.

---

### Task 14: Final Verification

**Files:**
- Read: All modified handlers
- Read: `Program.cs`
- Read: `IHybridCacheService.cs`
- Read: `HybridCacheService.cs`
- Read: `OpenSaur.CashPilot.Web.csproj`

**Interfaces:**
- Verify: All 5 read endpoints have cache integration.
- Verify: All 15 mutation endpoints have cache invalidation.
- Verify: DI registration is correct.
- Verify: No compilation errors.

- [ ] **Step 1: Verify all files**

Read all modified files to confirm correctness and consistency.

- [ ] **Step 2: Check for build errors**

Run `dotnet build src/OpenSaur.CashPilot.Web/OpenSaur.CashPilot.Web.csproj` to verify no compilation errors.

---

## Self-Review

**1. Spec coverage:**
- Banks: Task 4 (read) + Task 9 (invalidate)
- Currencies: Task 5 (read) + Task 10 (invalidate)
- Counterparties: Task 6 (read) + Task 11 (invalidate)
- Tags: Task 7 (read) + Task 12 (invalidate)
- Templates: Task 8 (read) + Task 13 (invalidate)
- Infrastructure: Task 1 (package), Task 2 (service), Task 3 (DI registration)
- Verification: Task 14

**2. Placeholder scan:** No placeholders found. All code blocks are complete.

**3. Type consistency:** All handlers use `IHybridCacheService` with identical method signatures. Cache keys follow `{feature}:{userId}` pattern consistently. TTL is `TimeSpan.FromMinutes(5)` everywhere.

---

Plan complete and saved to `.agents/plans/20260717-hybrid-cache.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
