# Feature 001: Foundation, Auth (OIDC/OpenIddict/M2M), Entities & Zentry Kafka Sync

## Overview
Set up the ASP.NET Core 10 Web API project using **Feature Slice Architecture** (`Domain/`, `Features/`, `Infrastructure/`), PostgreSQL database with EF Core 10, all domain entities inheriting `EntityBase`, OpenIddict validation and OIDC cookie auth matching CashPilot, project-scoped M2M Agent Token generation, Kafka consumer service for syncing workspaces and users from Zentry (on Aiven), and project CRUD endpoints with Creator top-admin permission management.

---

## Tasks

- [ ] 1. Initialize ASP.NET Core 10 Web API project in `src/OpenSaur.RuleAgent.Web` structured using Feature Slice Architecture (`Domain/`, `Features/`, `Infrastructure/`).
- [ ] 2. Create `EntityBase` domain base class (`Id`, `Description`, `IsActive`, `CreatedBy`, `CreatedOn`, `UpdatedBy`, `UpdatedOn`) and `IEntityBase` interface in `Domain/Common/`.
- [ ] 3. Create domain entities in `Domain/`: `Workspace`, `User`, `Project`, `ProjectUserPermission`, `AgentToken`, `Node`, `NodeClosure`, and `NodeSnapshot`.
- [ ] 4. Configure EF Core DbContext in `Infrastructure/Database/` with PostgreSQL (`Npgsql`) and EF entity configurations (indices, foreign keys, array types).
- [ ] 5. Implement Auth slice in `Features/Auth/`:
  - OpenIddict validation for bearer tokens
  - OIDC Cookie authentication against Zentry (matching CashPilot pattern)
  - Current session/profile endpoint, login redirect, callback, logout, and token refresh
- [ ] 6. Generate and apply initial EF Core database migration.
- [ ] 7. Implement Kafka consumer service in `Infrastructure/Messaging/` using `Confluent.Kafka` to consume `UserSyncEvent` from Zentry (hosted on Aiven) and upsert `Workspace` and `User` records.
- [ ] 8. Implement Project CRUD slice in `Features/Projects/` (`ProjectsEndpoints.cs`, `Dtos/`, `Handlers/`, `Validations/`) with Creator set as top admin.
- [ ] 9. Implement Project permission management slice in `Features/ProjectPermissions/` (Creator assigning/updating `CanView` and `CanEdit` roles).
- [ ] 10. Implement Agent Tokens slice in `Features/AgentTokens/` (generate, list, and revoke project-scoped M2M tokens for Coding Agents).
