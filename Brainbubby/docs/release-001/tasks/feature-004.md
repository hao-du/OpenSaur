# Feature 004: Instruction Templates (`Features/Templates/`)

## Overview
Implement instruction templates unified under the `Node` aggregate root (`NodeType.Template`, `ProjectId = null`) in `Features/Templates/`. Templates define workspace-level boilerplate guidelines (e.g. AGENTS.md, guidelines, release standards) that can be linked to projects (`Project.InstructionTemplateNodeId`). Mutations (create, update, delete) are strictly gated to the `SuperAdministrator` role, while read queries are available to all authenticated workspace members.

---

## Tasks

- [x] 1. Create DTOs and FluentValidation validators for template operations in `Features/Templates/Dtos/` and `Features/Templates/Validations/`.
- [x] 2. Implement template read handlers in `Features/Templates/Handlers/` (`GetTemplatesHandler`, `GetTemplateByIdHandler`) scoped to the user's workspace.
- [x] 3. Implement template mutation handlers in `Features/Templates/Handlers/` (`CreateTemplateHandler`, `UpdateTemplateHandler`, `DeleteTemplateHandler`) enforcing the `SuperAdministrator` role.
- [x] 4. Map endpoints in `Features/Templates/TemplatesEndpoints.cs`, register validators in `Program.cs`, and verify build.

