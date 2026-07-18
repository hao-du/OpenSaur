# OpenSpec Workflow

## Purpose

Use `OpenSpec` as the planning and requirements layer for this repository. Before starting implementation, check whether the task is already described in existing specs or active changes.

## First Step for Any Task

Before coding, review both:

- `openspec/specs/` for current system requirements
- `openspec/changes/` for active or proposed work

If a task is already covered there, follow that context instead of inventing a parallel plan.

## Quick Checks

List specs:

```bash
openspec list --specs
```

List active changes:

```bash
openspec list
```

Validate specs or changes when needed:

```bash
openspec validate
```

Show a specific item:

```bash
openspec show <item-name>
```

## Expected Workflow

1. Check `openspec/specs/` and `openspec/changes/`
2. Check `bd ready --json` and any linked issue context
3. If the work is already specified, implement against that spec
4. If the work changes behavior or requirements, create or update an OpenSpec change first
5. After planning is clear, claim the `bd` issue and start implementation

## When to Create an OpenSpec Change

Create or update an OpenSpec change when the task:

- adds a new feature
- changes user-visible behavior
- changes requirements or business rules
- needs a design or implementation plan that should persist across sessions

## Repository Paths

- Specs: `openspec/specs/`
- Proposed or active changes: `openspec/changes/`
- Codex OpenSpec skills: `.codex/skills/`

## Important Rules

- Read the relevant local skills before planning or implementation
- Do not start implementation without checking `OpenSpec` first
- Do not add unit tests or automation tests unless explicitly requested
- Do not create git commits automatically unless explicitly requested
- Do not place agentic files, AI instruction files, or workflow docs inside `src/`
- Do not add data seeding or startup seeding code unless explicitly requested
- Do not treat example names, client IDs, secrets, URLs, or sample values from discussion as real implementation values
- Do not keep planning context only in chat if it belongs in `OpenSpec`
- Prefer updating existing spec/change artifacts over creating duplicate documentation
