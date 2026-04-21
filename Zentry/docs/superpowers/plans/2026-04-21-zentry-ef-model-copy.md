# Zentry EF Model Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Copy Identity's EF entities, EF configurations, and `ApplicationDbContext` into Zentry without importing catalogs or surrounding infrastructure.

**Architecture:** Mirror the model folder structure from Identity, but keep only entity/configuration/context files. Strip seeding and current-user accessor dependencies so the copied model compiles as a standalone EF surface inside Zentry.

**Tech Stack:** ASP.NET Core, ASP.NET Identity, EF Core, Npgsql, OpenIddict EF Core

---

### Task 1: Add model entities

**Files:**
- Create: `src/OpenSaur.Zentry.Web/Domain/Common/AuditedEntity.cs`
- Create: `src/OpenSaur.Zentry.Web/Domain/Common/IAuditedRecord.cs`
- Create: `src/OpenSaur.Zentry.Web/Domain/Identity/ApplicationRole.cs`
- Create: `src/OpenSaur.Zentry.Web/Domain/Identity/ApplicationUser.cs`
- Create: `src/OpenSaur.Zentry.Web/Domain/Identity/ApplicationUserRole.cs`
- Create: `src/OpenSaur.Zentry.Web/Domain/Permissions/Permission.cs`
- Create: `src/OpenSaur.Zentry.Web/Domain/Permissions/PermissionScope.cs`
- Create: `src/OpenSaur.Zentry.Web/Domain/Permissions/RolePermission.cs`
- Create: `src/OpenSaur.Zentry.Web/Domain/Workspaces/Workspace.cs`
- Create: `src/OpenSaur.Zentry.Web/Domain/Workspaces/WorkspaceRole.cs`
- Create: `src/OpenSaur.Zentry.Web/Domain/Outbox/OutboxMessage.cs`

- [ ] Copy the entity classes required by the EF model.
- [ ] Exclude catalogs, definitions, constants, and payload records.

### Task 2: Add EF configurations and context

**Files:**
- Create: `src/OpenSaur.Zentry.Web/Infrastructure/Database/ApplicationDbContext.cs`
- Create: `src/OpenSaur.Zentry.Web/Infrastructure/Database/Configurations/ApplicationRoleConfiguration.cs`
- Create: `src/OpenSaur.Zentry.Web/Infrastructure/Database/Configurations/ApplicationUserConfiguration.cs`
- Create: `src/OpenSaur.Zentry.Web/Infrastructure/Database/Configurations/ApplicationUserRoleConfiguration.cs`
- Create: `src/OpenSaur.Zentry.Web/Infrastructure/Database/Configurations/IdentitySupportEntityConfigurations.cs`
- Create: `src/OpenSaur.Zentry.Web/Infrastructure/Database/Configurations/OutboxMessageConfiguration.cs`
- Create: `src/OpenSaur.Zentry.Web/Infrastructure/Database/Configurations/PermissionConfiguration.cs`
- Create: `src/OpenSaur.Zentry.Web/Infrastructure/Database/Configurations/PermissionScopeConfiguration.cs`
- Create: `src/OpenSaur.Zentry.Web/Infrastructure/Database/Configurations/RolePermissionConfiguration.cs`
- Create: `src/OpenSaur.Zentry.Web/Infrastructure/Database/Configurations/WorkspaceConfiguration.cs`
- Create: `src/OpenSaur.Zentry.Web/Infrastructure/Database/Configurations/WorkspaceRoleConfiguration.cs`

- [ ] Copy the configuration classes and remove all seeding references.
- [ ] Copy `ApplicationDbContext` and trim current-user accessor dependencies.

### Task 3: Add package references and verify

**Files:**
- Modify: `src/OpenSaur.Zentry.Web/OpenSaur.Zentry.Web.csproj`

- [ ] Add the minimum EF/Identity/OpenIddict package references needed for the copied model surface.
- [ ] Run `dotnet build src/OpenSaur.Zentry.Web/OpenSaur.Zentry.Web.csproj`.
