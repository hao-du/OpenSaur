# Project Notes

## Build & Test

CoreGate is a .NET 10 web app with a React login frontend under `src/OpenSaur.CoreGate.Web/Frontend`.

```bash
dotnet build src/OpenSaur.CoreGate.Web/OpenSaur.CoreGate.Web.csproj
dotnet run --project src/OpenSaur.CoreGate.Web/OpenSaur.CoreGate.Web.csproj
```

Development launch profiles currently use:

- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`

Frontend build:

```bash
cd src/OpenSaur.CoreGate.Web/Frontend
npm install
npm run build
```

Notes:

- Do not add automated tests unless explicitly requested.
- Do not add startup or data seeding code.
- OIDC clients are expected to exist in the shared OpenIddict application store outside this app.

## Architecture Overview

`OpenSaur.CoreGate.Web` is the central OIDC provider for the wider solution.

- Backend: Minimal API + ASP.NET Core Identity + OpenIddict + EF Core + PostgreSQL
- Frontend: React login screen only
- Persistence: shared Identity/OpenIddict PostgreSQL database
- Scope: issuer endpoints, login/logout flow, token claim projection
- Out of scope: user management UI, role/workspace management UI, in-code client seeding

Current implementation shape:

- `Program.cs` wires the app through focused service-registration extensions and endpoint maps.
- `Infrastructure/DependencyInjection/` contains runtime service registration for configuration, database, and OpenIddict/Identity.
- `Features/Auth/` contains endpoint maps, DTOs, handler classes, and user role/permission loading used by the OIDC flow.
- `Infrastructure/Security/` contains shared claim constants, cookie names, and principal/claim helpers.

## Conventions & Patterns

- Keep auth flow code explicit and easy to trace.
- Reuse the shared Identity schema shape rather than inventing a parallel model.
- Use native OpenIddict and ASP.NET Core Identity primitives instead of custom auth protocol code.
- Do not treat example values from discussion as real implementation configuration.
- Prefer small handler and helper classes over large auth flow files, but keep naming purpose-specific and easy to scan.
