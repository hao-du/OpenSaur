# Agent Instructions: CashPilot

## Memory Workflow
1. **Context Discovery**: Read `AGENTS.md`, `.agent/rules/`, `.agent/requirements/`, and `.agent/session_log.md`.
2. **Task Tracking**: Use `todowrite` for multi-step tasks.
3. **Logging**: Update `.agent/session_log.md` after significant work.

## Core Context
- **Architecture**: Monolith SPA. .NET 10 Web API backend serves Vite-built React 19 frontend from `wwwroot`.
- **Routing**: Uses custom SPA client-side routing via `app.MapFrontEndRoutes()`.
- **Auth**: OpenIddict (OIDC/JWT).
- **Stack**: .NET 10, EF Core (Npgsql), PostgreSQL, React 19, TypeScript, MUI, TanStack Query.

## Key Commands
- **Backend**: `dotnet run --project src/OpenSaur.CashPilot.Web`
- **Frontend**: `npm run dev` (run in `src/OpenSaur.CashPilot.Web/client`)

## Project Structure
- `src/OpenSaur.CashPilot.Web/Features/`: Feature-based backend logic.
- `src/OpenSaur.CashPilot.Web/client/`: React frontend source.
- `.agent/rules/`: Coding patterns and conventions.
- `.agent/requirements/`: Business logic and feature specs.

## Specialized Skills
Always check and use available skills in `.agent/skills/` when performing tasks.

### superpowers
- `brainstorming`
- `dispatching-parallel-agents`
- `executing-plans`
- `receiving-code-review`
- `requesting-code-review`
- `subagent-driven-development`
- `systematic-debugging`
- `test-driven-development`
- `using-git-worktrees`
- `using-superpowers`
- `verification-before-completion`
- `writing-plans`
- `writing-skills`

### dotnet-skills
- `configuring-opentelemetry-dotnet`
- `dotnet-aot-compat`
- `dotnet-webapi`
- `migrate-dotnet10-to-dotnet11`
- `migrate-nullable-references`
- `mtp-hot-reload`
- `optimizing-ef-core-queries`
- `verification-before-completion`
- `writing-mstest-tests`

### vercel-agent-skills
- `composition-patterns`
- `react-best-practices`
