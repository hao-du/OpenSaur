# Beads Workflow

## Issue Tracking with `bd`

This project uses `bd` for all issue tracking. Do not use markdown TODOs, task lists, or a second tracking system.

## Why `bd`

- Dependency-aware: track blockers and relationships between issues
- Git-friendly: Dolt-powered version control with native sync
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

## Quick Start

Check for ready work:

```bash
bd ready --json
```

Create new issues:

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

Claim and update:

```bash
bd update <id> --claim --json
bd update bd-42 --priority 1 --json
```

Complete work:

```bash
bd close bd-42 --reason "Completed" --json
```

## Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

## Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

## Workflow for AI Agents

1. Check `OpenSpec` first for existing specs and active changes
2. Check ready work: `bd ready` shows unblocked issues
3. Claim your task atomically: `bd update <id> --claim`
4. Work on it: implement, test, document
5. Discover new work: create a linked issue with `--deps discovered-from:<parent-id>`
6. Complete: `bd close <id> --reason "Done"`

## Quality

- Use `--acceptance` and `--design` fields when creating issues
- Use `--validate` to check description completeness

## Lifecycle

- `bd defer <id>` / `bd supersede <id>` for issue management
- `bd stale` / `bd orphans` / `bd lint` for hygiene
- `bd human <id>` to flag for human decisions
- `bd formula list` / `bd mol pour <name>` for structured workflows

## Auto-Sync

- Each write auto-commits to Dolt history
- Use `bd dolt push` / `bd dolt pull` for remote sync
- No manual export/import needed

## Important Rules

- Read the relevant local skills before planning or implementation
- Check `OpenSpec` before starting implementation
- Do not add unit tests or automation tests unless explicitly requested
- Do not create git commits automatically unless explicitly requested
- Do not place agentic files, AI instruction files, or workflow docs inside `src/`
- Do not add data seeding or startup seeding code unless explicitly requested
- Do not treat example names, client IDs, secrets, URLs, or sample values from discussion as real implementation values
- Use `bd` for all task tracking
- Always use the `--json` flag for programmatic use
- Link discovered work with `discovered-from` dependencies
- Check `bd ready` before asking what to work on
- Do not create markdown TODO lists
- Do not use external issue trackers
- Do not duplicate tracking systems

## Session Completion

When ending a work session, complete all steps below. Do not create git commits or push to remote unless explicitly requested.

1. File issues for remaining work
2. Run quality gates if code changed
3. Update issue status
4. Prepare git changes for review without auto-committing
5. If explicitly requested, sync to remote

```bash
bd dolt push
git pull --rebase
git push
git status
```

6. Clean up
7. Hand off context for the next session

## Critical Rules

- Do not create git commits automatically
- Do not push automatically
- If asked to push and push fails, resolve and retry until it succeeds
