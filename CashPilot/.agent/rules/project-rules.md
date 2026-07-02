# Project Rules

This document outlines the rules, guidelines, and behavioral expectations for AI agents working on the **CashPilot** project. **Important**: This file is strictly for operational rules; application requirements and feature specs must be handled via OpenSpec and should not be added here.

## Core Principles
- **Aesthetics First**: Every UI change must be premium, modern, and visually stunning.
- **Simplicity First**: Always prefer the simplest solution. Avoid unnecessary abstractions, hooks, or patterns when a straightforward approach works.
- **Clean Code**: Follow architectural patterns established in the `src` directory.
- **Pure Workspace**: `src` is for project code only; do not add any agentic files or configurations (like `.agent/` or `.superpowers/`) inside the `src` directory.
- **Safety**: Never run destructive commands without explicit confirmation.

## Interaction Rules
1. **Always Plan**: Provide an implementation plan before making significant changes.
2. **Follow .NET Patterns**: Use standard C# naming conventions and architectural patterns.
3. **Artifact Usage**: Use artifacts for reports, plans, and complex code blocks.
4. **Mandatory Review**: Always read **OpenSpec** and **Superpower** skills (located in `.agent/`) before thinking about or implementing anything. This includes `vercel-agent-skills`.
5. **OpenSpec First**: Always run **OpenSpec** commands (e.g., `/opsx:propose`) for any new requirement or change request.

## Custom Rules
- **No Testing**: Do not create unit tests or automation tests for either Backend (BE) or Frontend (FE).
- **No Verification Required**: Do not run verification steps (build, test, lint, or similar checks) unless explicitly requested.
- **No Auto-Commit**: Do not automatically commit code; always leave staging and committing to the user.
- **Migration Immutability**: After generating a database migration, never edit that migration file in place. If a schema adjustment is needed later, create a new migration instead of modifying or deleting the existing one. Existing migrations are assumed to be already applied and must remain intact to avoid DB drift.
- **Documentation Synchronization**: When implementing a new feature or making a significant technical change, you MUST verify if the corresponding documentation in `.agent/requirements/` or `.agent/technical_docs/` is up-to-date. If the change is not captured in these documents, update them immediately to ensure they remain the single source of truth for future agent sessions.
