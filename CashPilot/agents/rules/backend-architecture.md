# Backend API & Architecture Conventions

## Endpoint & Handler Layer Separation

- **No Direct `HttpContext` in Handlers**: Handlers must never take `HttpContext` directly as a parameter.
- **Endpoint Responsibility**: The endpoint mapping layer (`*Endpoints.cs`) is strictly responsible for inspecting HTTP-specific concepts (such as query strings, route parameters, headers, and `httpContext.User`).
- **Request DTOs**: Always extract and map HTTP parameters into a strongly-typed request DTO at the endpoint layer and pass that request DTO into the handler.
- **Pure Handlers**: Handlers should operate solely on request DTOs, dependency-injected services, and database contexts.

## Modern & Idiomatic Code Standards

- **Avoid Legacy Habits & Defensive Boilerplate**: Never apply legacy habits, defensive boilerplate, or redundant nested loops/wrappers unless strictly required by the underlying technology.
- **No Over-Engineering**: Avoid overcomplicated code; leverage modern framework and library capabilities directly (e.g., modern EF Core, Confluent.Kafka, ASP.NET Core built-ins). Write code that is cleaner, stable, and idiomatic.
