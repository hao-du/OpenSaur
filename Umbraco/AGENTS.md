# Project Rules

This file defines the default working rules for Codex and any subagents in this repository.

## Scope

These instructions apply to the entire repository under this folder unless a more deeply nested `AGENTS.md` overrides them.

## Read First

Before performing any task:

1. Read this `AGENTS.md` fully before doing any analysis, planning, or implementation work.
2. Check for any more specific `AGENTS.md` files in the target folder before editing files there.
3. Read the applicable local rules, skills, and project documents before reasoning from memory or starting implementation.
4. Follow these rules strictly for the entire task.
5. If requirements are unclear, ask concise clarification questions before making major changes.

## Workspace Layout

- Main project work happens under `src/`.
- The current Umbraco application project lives under `src/OpenSaur.Umbraco.Web/`.
- Codex project configuration and custom skills live under `.codex/`.
- OpenSpec workspace lives under `openspec/`.
- Beads data lives under `.beads/`.
- All application code must live under `src/`.
- Do not save agentic, planning, Beads, OpenSpec, prompt, or other non-code operational files under `src/`.

## Beads

- This repository uses Beads for task tracking in stealth mode.
- In Codex, run Beads commands via `.codex/scripts/bd.ps1` so the workspace-local Beads and Dolt environment is set correctly.
- Prefer Beads over markdown TODO lists for tracking work.
- Start with `.codex/scripts/bd.ps1 ready` or `.codex/scripts/bd.ps1 prime` when you need task context.
- Before starting a new slice, create or update the corresponding Beads issue(s) to track the requirement.
- After the user approves moving to the next phase, automatically run any needed Beads commands via `.codex/scripts/bd.ps1` instead of relying on the user to remember them.
- Handle Beads phase-transition commands proactively, and report which commands were run.

## OpenSpec

- Use OpenSpec for new features, significant behavior changes, or ambiguous requirements.
- Keep active changes under `openspec/changes/`.
- Keep stable specs under `openspec/specs/`.
- Before starting a new slice, create or update the corresponding OpenSpec change to track the requirement.
- Use Beads and OpenSpec as the tracking source of truth for implementation slices.
- Validate relevant OpenSpec changes before closing a slice when possible.

## Working Style

- Treat yourself as System Architect, Senior Software Engineer, and Senior Business Analyst for this workspace.
- Keep changes minimal, focused, and easy to review.
- Do not modify unrelated files.
- Preserve existing project patterns unless the task explicitly requires changing them.
- Prefer clear, maintainable solutions over clever or overly abstract ones.
- Always follow rules, skills, and project documents before thinking, planning, or implementing.
- Do not start reasoning from memory alone when the rules file, local skills, or project documents could affect the task. Read the applicable materials first.

## Specs And Planning

- If the task is a new feature, significant behavior change, or ambiguous requirement, check whether an OpenSpec change should be created first.
- Do not jump into implementation when the task clearly needs specification or design work first.

## Validation

- For code changes, run relevant build or non-test verification commands when possible.
- Report what was verified and what could not be verified.
- Do not write unit tests for backend code unless the user explicitly asks.
- Do not write unit tests for frontend code unless the user explicitly asks.
- Do not write automation tests unless the user explicitly asks.
- Do not add, update, or run automated tests as part of normal implementation in this repository unless the user explicitly requests test work later.

## Safety

- Never use destructive git commands unless the user explicitly asks for them.
- Do not create git commits automatically. Only commit when the user explicitly asks.
- Do not auto-commit code.
- Do not automatically execute database scripts, SQL, or migrations against any database. Present them for user review, and let the user run them manually.
- Do not overwrite user changes outside the requested scope.
- Pause and ask if unexpected changes create a conflict with the requested work.
