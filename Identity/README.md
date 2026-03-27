# OpenSaur Identity

This repository is set up to use:

- OpenSpec for requirements, proposals, and change artifacts
- superpowers skills for workflow discipline
- Beads for task tracking and session memory
- ASP.NET Core for the application in `src/OpenSaur.Identity.Web`

## Repository Layout

- `src/OpenSaur.Identity.Web/` - the .NET web app
- `openspec/` - OpenSpec workspace
- `.beads/` - Beads local data
- `.codex/scripts/bd.ps1` - project wrapper for running Beads commands in this workspace
- `AGENTS.md` - project rules for Codex and subagents

## What Each Tool Does

### OpenSpec

Use OpenSpec when deciding what to build and how to scope it.

- Explore ideas: `openspec-explore`
- Create a change proposal: `openspec-propose`
- Implement an approved change: `openspec-apply-change`
- Archive a completed change: `openspec-archive-change`

OpenSpec data for this repo lives in `openspec/`.

### superpowers

superpowers controls how work is done.

Examples:

- brainstorming before larger design work
- writing-plans before multi-step implementation
- test-driven-development before feature and bugfix coding
- systematic-debugging for failures and regressions
- verification-before-completion before claiming work is done

You do not normally run superpowers manually. Ask Codex to do the work, and it will use the matching skill when needed.

### Beads

Beads tracks work items and helps recover task context across sessions.

Always use the repo wrapper:

```powershell
.\.codex\scripts\bd.ps1 <command>
```

Examples:

```powershell
.\.codex\scripts\bd.ps1 prime
.\.codex\scripts\bd.ps1 ready
.\.codex\scripts\bd.ps1 create "Add login flow" -t feature -p 1
.\.codex\scripts\bd.ps1 update <id> --claim
.\.codex\scripts\bd.ps1 close <id>
```

## Session Start

You do not need to run `prime` every time you open the folder.

Use this rule:

- New AI/Codex session: run `.\.codex\scripts\bd.ps1 prime`
- Need to see available work: run `.\.codex\scripts\bd.ps1 ready`
- Already continuing the same task in the same session: usually no need to rerun `prime`

Recommended start sequence:

```powershell
.\.codex\scripts\bd.ps1 prime
.\.codex\scripts\bd.ps1 ready
```

## Build Workflow

### 1. Explore the idea

If the feature is still unclear, ask Codex:

```text
Use openspec-explore to help me shape <feature idea>
```

### 2. Create the change

When the feature is clear enough, ask Codex:

```text
Use openspec-propose for <change-name>: <what you want to build>
```

This creates artifacts under:

```text
openspec/changes/<change-name>/
```

### 3. Track the work in Beads

Create and claim a Beads issue for the implementation:

```powershell
.\.codex\scripts\bd.ps1 create "Build <feature>" -t feature -p 1
.\.codex\scripts\bd.ps1 update <id> --claim
```

### 4. Implement the change

Ask Codex to implement from the OpenSpec change:

```text
Use openspec-apply-change for <change-name>
```

Codex should use the relevant superpowers workflows automatically while implementing.

### 5. Finish the work

When the task is done:

```powershell
.\.codex\scripts\bd.ps1 close <id>
```

If the OpenSpec change is fully completed, ask Codex:

```text
Use openspec-archive-change for <change-name>
```

## Running the App

Build the current app:

```powershell
dotnet build .\src\OpenSaur.Identity.Web\OpenSaur.Identity.Web.csproj
```

Run the app:

```powershell
dotnet run --project .\src\OpenSaur.Identity.Web\OpenSaur.Identity.Web.csproj
```

The current starter endpoint is defined in `src/OpenSaur.Identity.Web/Program.cs`.

## Frontend Workflow

The first-party React client lives under `src/OpenSaur.Identity.Web/client`.

For frontend development:

```powershell
cd .\src\OpenSaur.Identity.Web\client
npm install
npm run dev
```

Vite runs on `http://localhost:5173` for frontend-only development and proxies `/api`, `/.well-known`, and `/connect` back to the ASP.NET Core host.

For same-host local review and deployment:

```powershell
cd .\src\OpenSaur.Identity.Web\client
npm run build
dotnet run --project ..\OpenSaur.Identity.Web.csproj
```

The client build writes into `src/OpenSaur.Identity.Web/wwwroot`, and ASP.NET Core serves the built app on the same host as the backend routes.

Current hosted auth routes:

- `/login`
- `/auth/callback`
- `/change-password`
- `/`

Browser automation note:

- frontend unit/integration-style tests stay close to the client app
- browser automation should be added later in a separate automation test project, not inside `src/OpenSaur.Identity.Web/client`

## Example Prompt

To kick off the next feature, you can say:

```text
Use openspec-propose for add-login: add login and JWT auth to the ASP.NET app, then track implementation in Beads
```

Or if you already have a change and want to build it:

```text
Use openspec-apply-change for <change-name>
```
