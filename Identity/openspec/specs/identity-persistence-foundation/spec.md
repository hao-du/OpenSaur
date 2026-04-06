# identity-persistence-foundation Specification

## Purpose
Define the PostgreSQL, EF Core, ASP.NET Core Identity, and OpenIddict persistence foundation for the Identity service.
## Requirements
### Requirement: The service SHALL use PostgreSQL with EF Core, ASP.NET Core Identity, and OpenIddict
The system SHALL persist identity, authorization server, and custom domain data in PostgreSQL using EF Core with ASP.NET Core Identity and OpenIddict entity mappings.

#### Scenario: Identity schema is created
- **WHEN** the Phase 1 database schema is generated
- **THEN** it includes the required ASP.NET Core Identity tables, OpenIddict tables, and app-owned custom tables

### Requirement: The database schema SHALL include baseline identity domain tables
The system SHALL include app-owned tables for workspaces, permissions, role-permissions, user-role assignments, and outbox messages, alongside the extended Identity entities required for the service.

#### Scenario: Custom identity foundation table exists
- **WHEN** the Phase 1 migration is reviewed
- **THEN** it includes tables for workspaces, permissions, role-permissions, user-role assignments, and outbox messages

### Requirement: Migrations SHALL be generated but not automatically executed
The system SHALL use EF Core migrations to track schema changes and SHALL generate idempotent SQL scripts for manual review and execution, but SHALL NOT apply migrations or scripts automatically at runtime.

#### Scenario: Manual script workflow
- **WHEN** a database change is prepared for deployment
- **THEN** the system provides a generated idempotent SQL script for manual review and execution instead of auto-applying the migration

### Requirement: Baseline seed data SHALL be migration-safe and deterministic
The system SHALL ensure that default roles, the default `Personal` workspace, the initial permission catalog, and the bootstrap `SystemAdministrator` account exist through migration-safe deterministic seeding.

#### Scenario: Default records are missing in a new environment
- **WHEN** the initial schema script is applied to an empty environment
- **THEN** the resulting database contains `Administrator`, `SuperAdministrator`, `User`, the `Personal` workspace, the initial permission catalog, and the seeded `SystemAdministrator` account with `RequirePasswordChange = true`

### Requirement: Secrets SHALL remain external to the committed schema design
The system SHALL read PostgreSQL connection information from configuration sources and SHALL NOT hardcode deployment credentials into application code or migration artifacts.

#### Scenario: Database configuration is loaded
- **WHEN** the service starts in an environment
- **THEN** it reads the connection string from configuration rather than from hardcoded source values

