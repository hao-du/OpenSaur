## 1. Data Model and Persistence

- [x] 1.1 Add tag definition entity/model (name, terms, status/metadata) and persistence mappings.
- [x] 1.2 Add `Tags` field to BankAccount, CashFlow, Transfer, and Exchange tables/entities and related migrations.
- [x] 1.3 Update repository/query projections and API DTO mappings to include `Tags`.

## 2. Backend Tag Management

- [x] 2.1 Implement Tag Management CRUD application services/endpoints.
- [x] 2.2 Add validation for tag uniqueness, empty names, and normalized matching terms.
- [x] 2.3 Wire authorization and settings navigation contract for tag management endpoints.

## 3. Transaction Tag Storage

- [x] 3.1 Persist transaction tags on create/edit flows for BankAccount, CashFlow, Transfer, and Exchange.
- [x] 3.2 Render transaction tags in list/detail views and forms.

## 4. Frontend

- [x] 4.1 Build Tag Management settings page with list/create/edit/delete interactions.
- [x] 4.2 Add `Tags` field rendering/editing in BankAccount, CashFlow, Transfer, and Exchange forms/tables.
- [x] 4.3 Ensure UX consistency with existing settings and transaction modules.

## 5. Configuration and Rollout

- [x] 5.1 Document operational behavior for tag storage and editing.
