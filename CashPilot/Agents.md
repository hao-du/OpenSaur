# Agent Instructions: CashPilot

## Memory Workflow
To maintain context across sessions and tasks, all agents must follow this workflow:

1.  **Context Discovery**: At the start of a session, read `AGENTS.md`, `.agent/rules/`, `.agent/requirements/`, and `.agent/session_log.md`.
2.  **Task Tracking**: Use the `todowrite` tool to manage active tasks.
3.  **Logging**: At the end of significant tasks or sessions, update `.agent/session_log.md` with current state, key decisions, and next steps.

## Project Rules
- Rules and conventions are documented in the `.agent/rules/` directory.

## Tech Stack
- **Backend**: .NET 10 Web API, Entity Framework Core (Npgsql), PostgreSQL, OpenIddict (OIDC), FluentValidation, JWT Authentication.
- **Frontend**: React 19, Vite, TypeScript, Material UI (MUI), TanStack Query, React Router, Axios, React Hook Form, Lucide React, Day.js.

## Development Workflow
- **Backend**: `dotnet run --project src/OpenSaur.CashPilot.Web`
- **Frontend**: `npm run dev` (run in `src/OpenSaur.CashPilot.Web/client`)
- **Database**: Requires a PostgreSQL instance with `CashPilotDb` connection string configured.

## Project Structure
- `src/OpenSaur.CashPilot.Web/`: Main application project.
  - `Features/`: Feature-based backend implementation.
  - `client/`: React frontend source.
- `devops/`: CI/CD (Azure Pipelines) and Docker configurations.
- `.agent/`: Project instructions and memory.
  - `rules/`: "How" (coding patterns/conventions).
  - `requirements/`: "What" (business logic/feature specs).
  - `session_log.md`: "Current" (decisions and progress).

## Architecture & Notes
- **Monolith SPA**: The .NET backend serves the Vite-built frontend assets from `wwwroot`.
- **Authentication**: Uses OpenIddict. API endpoints are protected via JWT/OIDC.
- **Routing**: Backend includes custom frontend routing (`app.MapFrontEndRoutes()`) to support SPA client-side routing.

