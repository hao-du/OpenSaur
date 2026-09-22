# Feature 001: Master Data Cache Invalidation

## Description
When creating, updating, or deleting master data (`Tags`, `Banks`, `Currencies`, `Counterparties`, `Templates`), the cache entries are only invalidated for the exact key without arguments (which defaults to `:act=all`). 

Because all frontend list views query with `isActive=true` (e.g. `:act=True:n=...`), the cached data returned to the browser is stale, and newly created or updated items fail to appear until the 5-minute cache TTL expires.

This feature introduces user-scoped cache version stamping for all master data domains, ensuring that any mutation (create, update, delete) immediately and atomically invalidates all filter variations (`act=True`, `act=False`, `act=all`, name searches, type filters) for that user.

---

## Tasks

### Item 1: Cache Version Keys in CacheConstants & CacheService
- [ ] Add versioning helpers in `CacheConstants` for each master data domain: `Banks`, `Currencies`, `Counterparties`, `Tags`, and `Templates`.
- [ ] Incorporate master data version keys or prefix eviction into cache key generation and cache invalidation.

### Item 2: Tags & Marker Tags Invalidation
- [ ] Update `GetTagsHandler` to utilize the user's tag cache version.
- [ ] Invalidate tag version and marker tag caches in `CreateTagHandler`, `UpdateTagHandler`, and `DeleteTagHandler`.
- [ ] Invalidate frontend query caches `["tags"]` and `["marker-tags"]` in mutation hooks.

### Item 3: Banks Cache Invalidation
- [ ] Update `GetBanksHandler` to utilize the user's bank cache version.
- [ ] Invalidate bank version in `CreateBankHandler`, `UpdateBankHandler`, and `DeleteBankHandler`.

### Item 4: Currencies Cache Invalidation
- [ ] Update `GetCurrenciesHandler` to utilize the user's currency cache version.
- [ ] Invalidate currency version in `CreateCurrencyHandler`, `UpdateCurrencyHandler`, and `DeleteCurrencyHandler`.

### Item 5: Counterparties Cache Invalidation
- [ ] Update `GetCounterpartiesHandler` to utilize the user's counterparty cache version.
- [ ] Invalidate counterparty version in `CreateCounterpartyHandler`, `UpdateCounterpartyHandler`, and `DeleteCounterpartyHandler`.

### Item 6: Templates Cache Invalidation
- [ ] Update `GetTemplatesHandler` to utilize the user's template cache version.
- [ ] Invalidate template version in `CreateTemplateHandler`, `UpdateTemplateHandler`, and `DeleteTemplateHandler`.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.

