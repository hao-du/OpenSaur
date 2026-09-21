# Backend API & Architecture Conventions

## Endpoint & Handler Layer Separation

- **No Direct `HttpContext` in Handlers**: Handlers must never take `HttpContext` directly as a parameter.
- **Endpoint Responsibility**: The endpoint mapping layer (`*Endpoints.cs`) is strictly responsible for inspecting HTTP-specific concepts (such as query strings, route parameters, headers, and `httpContext.User`).
- **Request DTOs**: Always extract and map HTTP parameters into a strongly-typed request DTO at the endpoint layer and pass that request DTO into the handler.
- **Pure Handlers**: Handlers should operate solely on request DTOs, dependency-injected services, and database contexts.
