## 1. Specification

- [x] 1.1 Draft proposal, design, tasks, and delta specs for DB-managed OIDC clients and super-admin CRUD

## 2. Backend Managed Client Model

- [x] 2.1 Add DB-backed managed OIDC client and origin entities plus EF migration
- [x] 2.2 Resolve the current client and redirect URIs from DB-managed origins and path base
- [x] 2.3 Synchronize active managed clients into OpenIddict applications and remove inactive ones
- [x] 2.4 Add super-administrator-only create, read, update, and deactivate APIs

## 3. Frontend Management Shell

- [x] 3.1 Add a super-administrator-only OIDC clients page in the hosted shell
- [x] 3.2 Show managed origins and derived redirect URIs in the admin UI
- [x] 3.3 Support create, edit, and deactivate flows without adding automated tests

## 4. Documentation And Verification

- [x] 4.1 Update login-flow and client-integration docs for DB-managed OIDC clients
- [x] 4.2 Build backend and frontend successfully and validate the OpenSpec change
