# Zentry Initial Migration Checkpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add EF tooling support and generate a baseline initial migration file for Zentry without updating the existing database.

**Architecture:** Introduce a design-time factory that constructs `ApplicationDbContext` from Zentry configuration, add a dedicated database connection string, and generate a single initial migration file in Zentry’s infrastructure database folder. Stop after file generation.

**Tech Stack:** EF Core 10, Npgsql, ASP.NET Core, .NET 10

---

### Task 1: Add design-time EF tooling support

**Files:**
- Create: `src/OpenSaur.Zentry.Web/Infrastructure/Database/DesignTimeApplicationDbContextFactory.cs`
- Modify: `src/OpenSaur.Zentry.Web/appsettings.json`
- Modify: `src/OpenSaur.Zentry.Web/appsettings.Development.json`

- [ ] Add a design-time factory implementing `IDesignTimeDbContextFactory<ApplicationDbContext>`.
- [ ] Load Zentry configuration from the project directory and read a dedicated connection string.
- [ ] Build `DbContextOptions<ApplicationDbContext>` with `UseNpgsql(...)`.

### Task 2: Generate the baseline migration

**Files:**
- Create: `src/OpenSaur.Zentry.Web/Infrastructure/Database/Migrations/<timestamp>_<name>.cs`
- Create: `src/OpenSaur.Zentry.Web/Infrastructure/Database/Migrations/ApplicationDbContextModelSnapshot.cs`

- [ ] Run `dotnet ef migrations add InitialCheckpoint --project src/OpenSaur.Zentry.Web/OpenSaur.Zentry.Web.csproj`.
- [ ] Confirm that migration files are created under Zentry’s migrations folder.
- [ ] Do not run `dotnet ef database update`.

### Task 3: Verify checkpoint generation

**Files:**
- Modify: none

- [ ] Run `dotnet build src/OpenSaur.Zentry.Web/OpenSaur.Zentry.Web.csproj`.
- [ ] Confirm no database update commands were executed.
