# Project Instructions for AI Agents

This file is the entrypoint for AI agent guidance in this project.

<!-- BEGIN BEADS INTEGRATION v:1 profile:full -->
## Core Rules

- Always read the relevant local skills before thinking, planning, or implementing
- Before starting any task, check both `OpenSpec` and `Beads` for existing context
- Do not add unit tests or automation tests unless explicitly requested
- Do not create git commits automatically unless explicitly requested
- Do not place agentic files, AI instruction files, or workflow docs inside `src/`
- Do not add data seeding or startup seeding code unless explicitly requested
- Do not treat example names, client IDs, secrets, URLs, or sample values from discussion as real implementation values
- Use `bd` for all task tracking
- Do not create markdown TODO lists or use a second issue tracker
- Prefer `bd ready --json` before starting new work
- Review relevant specs or changes in `openspec/` before implementation
- Use `bd update <id> --claim --json` when taking ownership
- Link discovered work with `discovered-from` dependencies

## Detailed Guidance

- OpenSpec workflow: `docs/agents/openspec.md`
- Beads workflow: `docs/agents/beads.md`
- Project notes: `docs/agents/project.md`
<!-- END BEADS INTEGRATION -->

## Project-Specific Notes

Keep critical repo rules in this file. Put longer reference material in `docs/agents/` and link it from here.
