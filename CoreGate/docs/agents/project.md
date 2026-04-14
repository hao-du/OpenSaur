# Project Notes

## Build & Test

CoreGate is a .NET 10 web app with a React login frontend under `src/OpenSaur.CoreGate.Web/Frontend`.

```bash
dotnet build src/OpenSaur.CoreGate.Web/OpenSaur.CoreGate.Web.csproj
dotnet run --project src/OpenSaur.CoreGate.Web/OpenSaur.CoreGate.Web.csproj
```

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

## Conventions & Patterns

- Keep auth flow code explicit and easy to trace.
- Reuse the shared Identity schema shape rather than inventing a parallel model.
- Use native OpenIddict and ASP.NET Core Identity primitives instead of custom auth protocol code.
- Do not treat example values from discussion as real implementation configuration.
