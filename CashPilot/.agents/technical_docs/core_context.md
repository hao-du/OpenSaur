## Core Context Documentation

This document summarizes the high‑level architecture, routing, authentication, and technology stack for the CashPilot project. It is used by developers to quickly understand the overall structure without needing to read the full `AGENTS.md`.

### Architecture
- **Monolith SPA** – single-page application with a .NET 10 Web API backend.
- **Frontend** built with React 19, Vite, and served from the `wwwroot` folder.

### Routing
- Custom SPA routing via `app.MapFrontEndRoutes()` in the ASP.NET Core pipeline.

### Authentication
- OpenIddict (OIDC/JWT) for user authentication and session management.

### Technology Stack
- .NET 10
- EF Core with Npgsql provider
- PostgreSQL database
- React 19 + TypeScript
- Material UI components
- TanStack Query for data fetching
