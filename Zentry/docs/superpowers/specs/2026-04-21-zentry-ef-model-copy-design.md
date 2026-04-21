# Zentry EF Model Copy Design

## Goal

Copy the EF model surface from Identity into Zentry while excluding catalogs, seeding, migrations, repositories, and other surrounding application logic.

## Scope

Included:
- EF entity classes
- EF configuration classes
- `ApplicationDbContext`
- minimum package references needed to compile the copied EF model

Excluded:
- catalogs and definition helpers
- seed data and seeding helpers
- migrations
- repositories
- design-time factory
- current-user/security support helpers unrelated to the EF model shape

## Design

Mirror the backend structure in Zentry:
- `Domain/Common`
- `Domain/Identity`
- `Domain/Permissions`
- `Domain/Workspaces`
- `Domain/Outbox`
- `Infrastructure/Database`
- `Infrastructure/Database/Configurations`

Trim the copied surface so it stays model-only:
- copy only entity classes needed by `ApplicationDbContext`
- remove all `HasData(...)` seeding calls from configuration classes
- simplify `ApplicationDbContext` to keep audit timestamp/id defaults without bringing over Identity's current-user accessor infrastructure

## Verification

- `dotnet build src/OpenSaur.Zentry.Web/OpenSaur.Zentry.Web.csproj`
