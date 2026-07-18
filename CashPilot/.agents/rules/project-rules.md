# Project Rules

**This file is for operational rules only.** Feature specs belong in `.agents/requirements/`.

## Core Principles
- **Aesthetics First**: Every UI change must be premium, modern, visually stunning.
- **Simplicity First**: Prefer the simplest solution; avoid unnecessary abstractions.
- **Clean Code**: Follow architectural patterns in `src`.
- **Pure Workspace**: No agentic files (`.agents/`, `.superpowers/`) inside `src/`.
- **Safety**: Never run destructive commands without explicit confirmation.

## Interaction Rules
1. Always provide an implementation plan before significant changes.
2. Follow standard C#/.NET naming conventions.
3. Use artifacts for reports, plans, and complex code blocks.
4. Always read OpenSpec and Superpower skills in `.agents/` before implementing anything.
5. Always run OpenSpec commands (e.g., `/opsx:propose`) for new requirements.

## Custom Rules
- **No Testing**: No unit/automation tests for BE or FE.
- **No Verification**: Don't run build/test/lint unless explicitly requested.
- **No Auto-Commit**: Leave staging and committing to the user.
- **Migration Immutability**: Never edit existing migration files; create new ones for schema changes.
- **Documentation Sync**: When implementing features or significant changes, update `.agents/requirements/` and `.agents/technical_docs/` to stay current.
