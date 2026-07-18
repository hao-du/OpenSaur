# Agent Instructions: CashPilot

**Always read all required files before performing any task**. Follow the Memory Workflow steps below.

## Memory Workflow

Before performing any task, complete the following in order:

1. Read `AGENTS.md`.
2. **Discovery**: Run a recursive directory listing of `.agents/` (e.g., `ls -R .agents`) to identify all relevant files and subdirectories.
3. Read **every Markdown file** found within `.agents/rules/` and its subdirectories.
4. Read **every Markdown file** found within `.agents/requirements/` and its subdirectories.
5. Read **every Markdown file** found within `.agents/technical_docs/` and its subdirectories.
6. Read `.agents/session_log.md`.
7. Read any skill documentation in `.agents/skills/` that is relevant to the current task.

**Important:**

- Reading a directory does **not** count as reading its files.
- You must read each required file individually.
- Do not assume you know a file's contents from a previous task.
- If a required file changes, re-read it before continuing.

**Exclusion Note:** When scanning directories for Markdown files, skip any temporary or build folders such as `node_modules`, `bin`, `obj`, `dist`, or any folder that ends with `.temp`. This reduces token usage and avoids reading generated content.

Before starting implementation, list the exact files you have read.

---
## Mandatory Execution Protocols

To ensure code integrity and prevent regression, every modification task MUST follow this protocol:

### 1. Pre-Edit Verification (The "Read-Before-Write" Rule)
Never attempt an `Edit` or `Write` operation based on a cached or previous reading of the file. You must execute a `Read` tool call on the specific lines you intend to Prime modify immediately before calling `Edit`.

### 2. Surgical Implementation (The "Minimalist Change" Rule)
Avoid large-scale block replacements or wholesale rewrites of files. Prioritize small, targeted edits that only touch the necessary lines. If a change is too large to be safe in one `Edit` call, break it into multiple smaller, sequential `Edit` calls.

### 3. Post-Change Validation (The "Trust but Verify" Rule)
An operation is not complete until its success is verified via:
- **Linting**: Running `npm run lint` or equivalent to ensure no syntax/style errors.
- **Testing**: Running relevant tests to ensure no functional regressions.
- **Structural Verification**: Performing a `Read` on the modified section to confirm content is as intended.

### 4. Full-Stack Traceability (The "Root Cause" Rule)
When investigating issues related to UI elements that depend on dynamic data or routing (e.g., side menus, navigation links), do not assume the issue is purely frontend. You MUST trace the data flow back to its backend source (AP/Services/Controllers/Endpoints). A fix in the frontend is incomplete if the underlying backend contract has not been updated.

### Verification Rules
1. **Consult the library's typings or official docs** before using any method or property on a returned object.
2. **Prefer dedicated hooks** (e.g., `useWatch` from *react-hook-form*) over calling non‑existent methods on instances.
3. Write a minimal test snippet to confirm usage works with TypeScript before modifying production code.
4. Keep edits small and focused; avoid unnecessary abstractions.
5. Run lint/TypeScript immediately after changes to catch any misuse.

---
## Planning Protocol

All the plan will be created in `.agents/plans` with format: `yyyymmdd-{plan-name}`

When creating an implementation plan for a multi-step task, you MUST include high-precision instructions for every change to prevent ambiguity and errors in placement. Each step in the plan must specify:

1. **File Path**: The absolute path to the file being modified.
2. **Action**: [Create/Add/Remove/Update]
3. **Context**: The exact line or code snippet used to locate the target area (e.g., "Below `import X from 'Y'`").
4. **Change**: Precise instructions, e.g., 

"Add 
```
[new code]
``` 
below 
```
[existing code]
```
"

or 

"Append 
```
[new code]
``` 
after 
```
[existing code]
```
".
