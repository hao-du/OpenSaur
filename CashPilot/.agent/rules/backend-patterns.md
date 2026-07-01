# Backend Patterns

This document defines the architectural patterns used in the CashPilot backend.

## Feature-Based Architecture

The backend follows a feature-based structure. Each major domain (e.g., `Transactions`, `Banks`, `Profiles`) resides in `src/OpenSaur.CashPilot.Web/Features/{FeatureName}/`.

### Feature Directory Structure

A typical feature directory contains:
- `Dtos/`: Data Transfer Objects for requests and responses.
- `Handlers/`: Logic for processing specific operations. Handlers are often further categorized (e.g., `Handlers/BankAccount`, `Handlers/Transfer`) for complex domains.
- `Queries/`: Data retrieval logic.
    - `Providers/`: Implementation of specialized query interfaces to handle complex, polymorphic, or aggregated data fetching.
- `Services/`: Business logic that can be shared across multiple handlers or endpoints.
- `Validations/`: `FluentValidation` implementations for request models.
- `Helpers/`: Feature-specific extension methods or utility classes.
- `{FeatureName}Endpoints.cs`: The API endpoint definitions for the feature.

### Common Patterns

#### 1. Command/Query Separation (CQRS Lite)
- **Commands (Handlers)**: Operations that change state (Create, Update, Delete). They are implemented as `Handlers`.
- **Queries (Providers)**: Operations that retrieve data. They are implemented via `QueryProviders` to support complex, polymorphic, or aggregated data retrieval.

#### 2. Validation
- All incoming requests must be validated using `FluentValidation`.
- Validators should reside in the `Validations/` folder of the respective feature.

#### 3. Data Transfer Objects (DTOs)
- Never expose Domain Entities directly in API responses or requests.
- Use `Dtos/` to define the exact shape of data for the frontend.

#### 4. Dependency Injection & Service Registration
- All new services, handlers, and query providers must be registered in the dependency injection container.
- Check `Program.cs` or existing feature registration patterns to ensure new services are correctly scoped (`Scoped`, `Transient`, or `Singleton`).

#### 5. Error Handling
- Use `ProblemDetails` for standardized error responses.
- Ensure business logic failures (e.g., insufficient funds) return appropriate status codes via `ProblemDetails`.

#### 6. Authentication & Authorization
- All API endpoints must be secured using OpenIddict (JWT/OIDC).
- Use policy-based authorization where applicable.
