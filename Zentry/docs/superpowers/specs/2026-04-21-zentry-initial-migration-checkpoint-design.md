# Zentry Initial Migration Checkpoint Design

## Goal

Create an initial EF Core migration file for Zentry that captures the current database model as a starting checkpoint without applying any schema changes to the existing database.

## Context

Zentry now has an `ApplicationDbContext` and copied EF model types, but it does not yet have migration scaffolding. The database already exists, so this work must stop at generating the migration files and must not run `database update`.

## Scope

Included:
- a design-time `ApplicationDbContext` factory for EF tooling
- a database connection string/config path sufficient for migration generation
- one initial EF Core migration under Zentry’s database infrastructure

Excluded:
- applying the migration to any database
- editing existing database contents
- adding seed data
- changing runtime DI beyond what is strictly necessary for migration tooling

## Design

Add a Zentry `DesignTimeApplicationDbContextFactory` under `Infrastructure/Database` that loads configuration from Zentry appsettings and creates `ApplicationDbContext` with Npgsql.

Add a dedicated connection string entry in Zentry configuration so `dotnet ef` can resolve the database provider consistently during design time.

Generate a single initial migration as the checkpoint. This migration represents the current model snapshot only; it is not meant to be applied immediately against the already-existing database.

## Risks

If someone later runs `dotnet ef database update` blindly against an existing database, EF will attempt to apply the initial migration from scratch. This checkpoint should therefore be treated as a baseline for future migration history planning, not as an automatic deployment step.

## Verification

- `dotnet ef migrations add <name> --project src/OpenSaur.Zentry.Web/OpenSaur.Zentry.Web.csproj`
- `dotnet build src/OpenSaur.Zentry.Web/OpenSaur.Zentry.Web.csproj`
- no database update command executed
