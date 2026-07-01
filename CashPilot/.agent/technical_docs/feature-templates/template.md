# Feature Technical Documentation Template

Use this template to document the implementation details of a specific feature.

## Feature Name: [Feature Name]

### 1. Overview
High-level description of what this feature provides to the user and how it relates to the business requirements.

### 2. Architecture & Component Map
List the primary components involved in this feature and their responsibilities.
- **API Endpoints**: List the routes and the handlers they call.
- **Handlers/Services**: List the business logic classes and what they do.
- **Data Access**: List the Repositories, DbContext, or Entity Framework configurations used.
- **DTOs**: List the primary request/response objects.

### 3. Implementation Detail: Request Flow
Describe the step-by-step execution of a primary use case (e.g., "Creating a Transaction").
1.  **Request**: User calls `POST /api/transactions/create`.
2.  **Validation**: `TransactionRequestValidator` checks `Amount > 0`, etc.
3.  **Handler**: `CreateTransactionHandler` is invoked.
4.  **Business Logic**: `TransactionService` calculates taxes/totals.
5.  **Persistence**: `DbContext` saves the entity.
6.  **Response**: Returns `201 Created` with the new ID.

### 4. Key Logic & Complex Algorithms
Explain any non-obvious logic here.
- **Example**: "How the `AutoTagService` uses regex to match transaction descriptions to tags."
- **Example**: "How the `OfflineSyncService` resolves conflicts when re-connecting."

### 5. Data Model
Describe the key database entities and their relationships.
- `Transaction` -> belongs to `Bank`
- `Transaction` -> has many `TransactionItems`

### 6. Debugging & Troubleshooting
- **Common Errors**: List errors specific to this feature (e.g., "Incomplete Transfer Details").
- **Breakpoints**: Where to place breakpoints to inspect critical logic (e.g., in the `HandleAsync` method of the main handler).
- **SQL/Queries**: Show an example of the underlying SQL generated for complex queries.

### 7. Dependencies
List any external services or libraries this feature relies on (e.g., OpenIddict, FluentValidation).
