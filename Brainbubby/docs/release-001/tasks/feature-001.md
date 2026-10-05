# Feature 001: Foundation, Auth (OIDC/OpenIddict), Entities & Zentry Kafka Sync

## Overview
Set up the ASP.NET Core 10 Web API project using **Feature Slice Architecture + Domain-Driven Design (DDD)** (`Domain/`, `Features/`, `Infrastructure/`), PostgreSQL database with EF Core 10, domain entities inheriting `EntityBase` and implementing `IAggregateRoot`, OpenIddict validation and OIDC cookie auth matching CashPilot with Zentry as the single Authorization Server, Kafka consumer service for syncing workspaces and users from Zentry (on Aiven), and project CRUD endpoints with Creator top-admin permission management.

---

## Tasks

- [x] 1. Initialize ASP.NET Core 10 Web API project in `src/OpenSaur.Brainbubby.Web` structured using Feature Slice Architecture (`Domain/`, `Features/`, `Infrastructure/`).
- [x] 2. Create `EntityBase` domain base class (`Id`, `Description`, `IsActive`, `CreatedBy`, `CreatedOn`, `UpdatedBy`, `UpdatedOn`) and `IEntityBase` interface in `Domain/Common/`.
- [x] 3. Create domain entities in `Domain/` with DDD aggregate roots (`IAggregateRoot`), domain methods, and enums: `Workspace`, `User`, `Project`, `ProjectUserPermission`, `Node`, `NodeClosure`, and `NodeSnapshot`.
- [x] 4. Configure EF Core DbContext in `Infrastructure/Database/` with PostgreSQL (`Npgsql`) and EF entity configurations (indices, foreign keys, array types, enum conversions).
- [x] 5. Implement Auth & Profile slices:
  - OpenIddict validation for bearer tokens against Zentry authority
  - OIDC Cookie authentication against Zentry (matching CashPilot BFF pattern)
  - Token refresh pipeline via `ITokenService` & `AuthTokenRefreshCookieEvents`
  - Profile slice (`Features/Profile/`): `GET /api/profile/current` matching CashPilot
  - Auth endpoints (`Features/Auth/`): `/auth/login`, `/auth/logout` redirecting to Zentry
- [x] 6. Generate and apply initial EF Core database migration.
- [x] 7. Implement Kafka consumer service in `Infrastructure/Messaging/` using `Confluent.Kafka` to consume `UserSyncEvent` from Zentry (hosted on Aiven) and upsert `Workspace` and `User` records.
- [x] 8. Implement Settings slice in `Features/Settings/` with `GET /api/settings` for user locale & timezone preferences (matching CashPilot).
- [x] 9. Implement Project CRUD slice in `Features/Projects/` (`ProjectsEndpoints.cs`, `Dtos/`, `Handlers/`, `Validations/`) with Creator set as top admin.
- [x] 10. Implement Project permission management slice in `Features/ProjectPermissions/` (Creator assigning/updating `CanView` and `CanEdit` roles).

