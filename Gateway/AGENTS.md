# Project Rules

This file defines the default working rules for Codex and any subagents in this repository.

## Scope

These instructions apply to the entire repository under this folder unless a more deeply nested `AGENTS.md` overrides them.

## Read First

Before performing any task:

1. Read this `AGENTS.md` fully.
2. Check for any more specific `AGENTS.md` files in the target folder before editing files there.
3. If requirements are unclear, ask concise clarification questions before making major changes.

## Workspace Layout

- Main project work happens under `src/`.
- Codex project configuration and custom agents live under `.codex/`.
- OpenSpec workspace lives under `openspec/`.
- Beads data lives under `.beads/`.
- The current Gateway application project lives under `src/OpenSaur.Gateway/`.

## Beads

- This repository uses Beads for task tracking in stealth mode.
- In Codex, run Beads commands via `.codex/scripts/bd.ps1` so the workspace-local Beads and Dolt environment is set correctly.
- Prefer Beads over markdown TODO lists for tracking work.
- Start with `.codex/scripts/bd.ps1 ready` or `.codex/scripts/bd.ps1 prime` when you need task context.
- After the user approves moving to the next phase, automatically run any needed Beads commands via `.codex/scripts/bd.ps1` instead of relying on the user to remember them.
- Handle Beads phase-transition commands proactively, and report which commands were run.

## Working Style

- Keep changes minimal, focused, and easy to review.
- Do not modify unrelated files.
- Preserve existing project patterns unless the task explicitly requires changing them.
- Prefer clear, maintainable solutions over clever or overly abstract ones.

## Specs And Planning

- If the task is a new feature, significant behavior change, or ambiguous requirement, check whether an OpenSpec change should be created first.
- If the user wants requirements or specs, involve the Business Analyst and Solution Architect agents before implementation when appropriate.
- Do not jump into implementation when the task clearly needs specification or design work first.

## Review Gates

- At the end of each phase, stop and let the user review the work before moving to the next phase.
- Do not automatically move between phases such as specification, planning, implementation, validation, or cleanup without explicit user approval.

## Team Agents

Use project agents when their specialty matches the task:

- `Hoang Thi Huong Lan`: requirements analysis and specifications
- `Hang Le Quan`: solution architecture and system design
- `Tran Hoang Quan`: .NET backend implementation
- `Nguyen Bao Duy`: .NET backend implementation
- `Le Viet Hieu`: React and frontend implementation
- `Kulpreet Alagh`: UI/UX and responsive design
- `Ho Thanh Toan`: test cases and Playwright automation

These named agent definitions live under `.codex/agents/*.toml` and are the canonical project agents for this repository.

When delegation is needed:

- Prefer the matching named project agent from `.codex/agents/` over generic ad-hoc agents.
- Do not spawn generic `default`, `worker`, or `explorer` agents when a matching project agent already exists in `.codex/agents/`.
- Use a generic fallback agent only when no project agent fits the task or when the user explicitly asks for a different delegation shape.
- If delegation is not necessary, do the work directly instead of creating extra agents.

## Validation

- For code changes, run relevant build, test, or verification commands when possible.
- Report what was verified and what could not be verified.
- If there are project-specific checks mentioned in a more specific `AGENTS.md`, run them.
- For the initial Gateway slices, do not create a dedicated test project unless the user explicitly asks for one. Prefer build verification and focused manual/runtime checks until test work is requested.

## Safety

- Never use destructive git commands unless the user explicitly asks for them.
- Do not create git commits automatically. Only commit when the user explicitly asks.
- Do not automatically execute database scripts, SQL, or migrations against any database. Present them for user review, and let the user run them manually.
- Do not overwrite user changes outside the requested scope.
- Pause and ask if unexpected changes create a conflict with the requested work.
