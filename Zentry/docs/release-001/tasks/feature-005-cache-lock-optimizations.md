# Feature 005: Application Cache & Concurrency Lock Optimization

## Description
Apply `ICacheService` (`HybridCache`) and `ILockService` (Memory / Redis Distributed Lock) across high-frequency read endpoints and concurrency-sensitive write operations to optimize performance and prevent race conditions.

---

## Tasks

### Item 1: Catalog & Profile Query Caching
- [x] Cache `/api/permissions` catalog in `GetPermissionsHandler` via `HybridCache` with 1-hour expiration.
- [x] Cache user profile and role details in `CurrentProfileHandler` (`/api/profile/current`) via `HybridCache` for 5 minutes by user ID.
- [x] Implement invalidation for user profile cache upon role assignment, user edits, or context switching.

### Item 2: Dashboard Summary Caching
- [x] Cache global and workspace summary counts in `GetDashboardSummaryHandler` (`/api/dashboard/summary`) with a 60-second window.
- [x] Invalidate dashboard summary cache when users, roles, or workspaces are created, edited, or deleted.

### Item 3: Concurrency Locking for High-Risk Mutations
- [x] Enforce distributed lock (`lock:workspace:users:{workspaceId}`) in `CreateUserHandler` and `EditUserHandler` during active user count verification against `Workspace.MaxActiveUsers`.
- [x] Enforce distributed lock (`lock:user:roles:{userId}` / `lock:role:users:{roleId}`) during role and permission assignment updates to prevent concurrent overwrite anomalies.
- [x] Enforce distributed lock on workspace creation (`lock:workspace:create:{name}`) to prevent parallel duplicate name creation.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[x]` will only be marked upon manual review and approval.

