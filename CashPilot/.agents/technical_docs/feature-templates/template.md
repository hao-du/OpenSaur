# Feature Technical Documentation Template

## Feature Name: [Feature Name]

### 1. Overview
High-level description: what it provides, relation to business requirements.

### 2. Architecture & Component Map
- **API Endpoints**: Routes and handlers.
- **Handlers/Services**: Business logic classes.
- **Data Access**: Repositories, DbContext, EF configurations.
- **DTOs**: Request/response objects.

### 3. Request Flow (Primary Use Case)
Example: "Creating a Transaction"
1. Request: `POST /api/transactions/create`
2. Validation: `TransactionRequestValidator` checks rules.
3. Handler: `CreateTransactionHandler` invoked.
4. Logic: `TransactionService` calculates taxes/totals.
5. Persistence: `DbContext` saves entity.
6. Response: `201 Created` with new ID.

### 4. Key Logic & Complex Algorithms
Non-obvious logic (e.g., auto-tagging regex matching, offline sync conflict resolution).

### 5. Data Model
Key entities and relationships (e.g., `Transaction` → `Bank`, `Transaction` → many `TransactionItems`).

### 6. Debugging
- **Common Errors**: Feature-specific errors.
- **Breakpoints**: Critical locations (e.g., `HandleAsync`).
- **SQL**: Example generated queries for complex operations.

### 7. Dependencies
External services/libraries (e.g., OpenIddict, FluentValidation).
