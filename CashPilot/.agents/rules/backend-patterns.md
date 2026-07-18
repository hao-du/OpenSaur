# Backend Patterns

## Feature-Based Architecture
Each domain (Transactions, Banks, Profiles) lives in `src/OpenSaur.CashPilot.Web/Features/{FeatureName}/`.

### Directory Layout
- `Dtos/` — Request/response DTOs
- `Handlers/` — Command logic (may have subfolders, e.g., `Handlers/Transfer`)
- `Queries/Providers/` — Complex/polymorphic data retrieval
- `Services/` — Shared business logic
- `Validations/` — FluentValidation validators
- `Helpers/` — Feature-specific utilities
- `{FeatureName}Endpoints.cs` — API route definitions

### Key Patterns
1. **CQRS Lite**: Commands via Handlers (state changes), Queries via Providers (data retrieval).
2. **Validation**: All requests validated with FluentValidation in `Validations/`.
3. **DTOs**: Never expose domain entities directly; use DTOs for API contracts.
4. **DI**: Register all services/handlers in DI container (check `Program.cs` for scoping).
5. **Errors**: Use `ProblemDetails` for standardized error responses with appropriate status codes.
6. **Auth**: All endpoints secured via OpenIddict (JWT/OIDC); use policy-based authorization.
