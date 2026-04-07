## 1. Spec And Model Alignment

- [ ] 1.1 Update the permission domain model, catalog, and seed data to use canonical string codes only and remove `Administrator.CanView`.
- [ ] 1.2 Update the OpenSpec change artifacts and the user-facing permission documentation to reflect the simplified string-based model.

## 2. Backend Refactor

- [ ] 2.1 Refactor permission authorization services, requirements, handlers, repositories, and endpoint helpers from `CodeId`/enum usage to canonical string code usage.
- [ ] 2.2 Refactor permission and role API contracts, handlers, and any in-repo consumers to stop exposing or consuming `CodeId` values.
- [ ] 2.3 Update JWT/session permission projection and any related auth flows so effective permission claims continue to emit canonical permission strings.

## 3. Database And Client Updates

- [ ] 3.1 Create an EF Core migration that removes `Permissions.CodeId`, removes obsolete `Administrator.CanView` seed data, and updates snapshots.
- [ ] 3.2 Generate SQL migration scripts for manual database application.
- [ ] 3.3 Update frontend/admin consumers so permission lookup and assignment flows work with canonical string codes only.

## 4. Verification

- [ ] 4.1 Run relevant non-test build verification for backend and frontend.
- [ ] 4.2 Validate the OpenSpec change and update Beads with the implementation outcome.
