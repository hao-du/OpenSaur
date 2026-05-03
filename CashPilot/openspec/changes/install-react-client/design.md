## Context

The `src/OpenSaur.CashPilot.Web/client` directory exists but is empty. We need to scaffold a React application using Vite.

## Goals / Non-Goals

**Goals:**
- Initialize a React project with TypeScript support.
- Use Vite as the build tool for fast development.
- Maintain a clean and standard scaffold.

**Non-Goals:**
- Customizing the folder structure beyond the standard scaffold (user will do this).
- Adding styling libraries or state management at this stage.

## Decisions

- **Tooling**: Use `create-vite` as it's the standard and recommended way to start a Vite-based project.
- **Template**: Use `react-ts` to provide a type-safe environment from the start.
- **Target Directory**: Install directly into the existing `client` folder.

## Risks / Trade-offs

- **Dependency Management**: Adding a Node.js project within a .NET workspace requires managing two different dependency systems (NPM and NuGet).
- **Vite Configuration**: Default configuration might need adjustment later for integration with ASP.NET Core, but that is out of scope for this initial task.
