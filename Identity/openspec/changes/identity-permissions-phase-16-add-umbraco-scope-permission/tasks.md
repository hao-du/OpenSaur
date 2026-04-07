## 1. Catalog And Seed Data

- [x] 1.1 Add the `Umbraco` permission scope and `Umbraco.CanManage` permission to the code-owned catalogs.
- [x] 1.2 Add stable seed identifiers and seed rows for the new scope and permission without default role assignments.

## 2. Database Artifacts

- [x] 2.1 Create an EF Core migration that inserts the new permission scope and permission rows and updates snapshots.
- [x] 2.2 Generate SQL migration scripts for manual database application.

## 3. Documentation And Verification

- [x] 3.1 Update the permission documentation to include the new Umbraco scope and permission.
- [x] 3.2 Run relevant non-test build verification and OpenSpec validation.
- [x] 3.3 Update Beads with the implementation outcome.
