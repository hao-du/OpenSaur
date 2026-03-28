# Identity FE Phase 3 Workspaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder `Workspaces` page with a real backend-backed workspace management surface that supports listing, searching, creating, and editing workspaces, including activation state updates.

**Architecture:** Add a dedicated frontend `workspaces` feature slice that follows the existing auth feature structure. Keep page-level orchestration in `WorkspacesPage`, move API/query/mutation concerns into the feature folder, and render the UX through a searchable table plus shared create/edit drawer form components.

**Tech Stack:** React 19, TypeScript, MUI, TanStack Query, React Hook Form, axios, Vitest, Testing Library

---

## File Structure

**Create**

- `src/OpenSaur.Identity.Web/client/src/features/workspaces/api/workspacesApi.ts`
- `src/OpenSaur.Identity.Web/client/src/features/workspaces/api/index.ts`
- `src/OpenSaur.Identity.Web/client/src/features/workspaces/hooks/useWorkspacesQuery.ts`
- `src/OpenSaur.Identity.Web/client/src/features/workspaces/hooks/useWorkspaceQuery.ts`
- `src/OpenSaur.Identity.Web/client/src/features/workspaces/hooks/useCreateWorkspace.ts`
- `src/OpenSaur.Identity.Web/client/src/features/workspaces/hooks/useEditWorkspace.ts`
- `src/OpenSaur.Identity.Web/client/src/features/workspaces/hooks/index.ts`
- `src/OpenSaur.Identity.Web/client/src/features/workspaces/queries/workspaceQueryKeys.ts`
- `src/OpenSaur.Identity.Web/client/src/features/workspaces/components/WorkspaceTable.tsx`
- `src/OpenSaur.Identity.Web/client/src/features/workspaces/components/WorkspaceForm.tsx`
- `src/OpenSaur.Identity.Web/client/src/features/workspaces/components/WorkspaceFormDrawer.tsx`
- `src/OpenSaur.Identity.Web/client/src/features/workspaces/components/index.ts`
- `src/OpenSaur.Identity.Web/client/src/features/workspaces/types.ts`
- `src/OpenSaur.Identity.Web/client/src/pages/workspaces/WorkspacesPage.test.tsx`

**Modify**

- `src/OpenSaur.Identity.Web/client/src/pages/workspaces/WorkspacesPage.tsx`
- `src/OpenSaur.Identity.Web/client/src/shared/api/index.ts`
- `src/OpenSaur.Identity.Web/client/src/shared/api/httpClient.ts`
- `src/OpenSaur.Identity.Web/client/src/components/molecules/controlled/index.ts`

## Task 1: Define Workspace API Contracts

**Files:**

- Create: `src/OpenSaur.Identity.Web/client/src/features/workspaces/types.ts`
- Create: `src/OpenSaur.Identity.Web/client/src/features/workspaces/api/workspacesApi.ts`
- Create: `src/OpenSaur.Identity.Web/client/src/features/workspaces/api/index.ts`
- Modify: `src/OpenSaur.Identity.Web/client/src/shared/api/index.ts`

- [x] Add TypeScript types for workspace list items, get-by-id response, create request, edit request, and mutation result handling.
- [x] Wrap the real backend endpoints in `workspacesApi.ts` using the shared `httpClient`.
- [x] Reuse the shared API error handling pattern already used elsewhere in the client.
- [x] Opt create and edit requests into the shared idempotency request policy.
- [x] Export the new API entry points from feature and shared index files where needed.
- [x] Verify the new API module compiles with `npm run build`.

## Task 2: Add Query and Mutation Hooks

**Files:**

- Create: `src/OpenSaur.Identity.Web/client/src/features/workspaces/queries/workspaceQueryKeys.ts`
- Create: `src/OpenSaur.Identity.Web/client/src/features/workspaces/hooks/useWorkspacesQuery.ts`
- Create: `src/OpenSaur.Identity.Web/client/src/features/workspaces/hooks/useWorkspaceQuery.ts`
- Create: `src/OpenSaur.Identity.Web/client/src/features/workspaces/hooks/useCreateWorkspace.ts`
- Create: `src/OpenSaur.Identity.Web/client/src/features/workspaces/hooks/useEditWorkspace.ts`
- Create: `src/OpenSaur.Identity.Web/client/src/features/workspaces/hooks/index.ts`

- [x] Add stable query keys for workspace list and workspace detail lookups.
- [x] Implement the workspace list query hook.
- [x] Implement the selected workspace detail query hook with an `enabled` guard for edit mode.
- [x] Implement create and edit mutation hooks that invalidate or refetch the workspace queries on success.
- [x] Keep hook APIs small and aligned with the existing auth hook style.
- [x] Verify the hook layer compiles with `npm run build`.

## Task 3: Build Workspace Table And Empty/Error States

**Files:**

- Create: `src/OpenSaur.Identity.Web/client/src/features/workspaces/components/WorkspaceTable.tsx`
- Create: `src/OpenSaur.Identity.Web/client/src/features/workspaces/components/index.ts`
- Modify: `src/OpenSaur.Identity.Web/client/src/pages/workspaces/WorkspacesPage.tsx`

- [x] Add a table component that renders loading, fetch-error, empty, and populated states.
- [x] Render columns for `Name`, `Description`, `Status`, and `Actions`.
- [x] Add row-level actions for `Edit` and one clearly disabled future action placeholder.
- [x] Keep the table responsive within the existing protected shell layout.
- [x] Replace the current `ComingSoonState` page body with the real page scaffold and client-side search state.
- [x] Verify the page renders correctly through `npm run build`.

## Task 4: Build Shared Create/Edit Drawer Form

**Files:**

- Create: `src/OpenSaur.Identity.Web/client/src/features/workspaces/components/WorkspaceForm.tsx`
- Create: `src/OpenSaur.Identity.Web/client/src/features/workspaces/components/WorkspaceFormDrawer.tsx`
- Modify: `src/OpenSaur.Identity.Web/client/src/pages/workspaces/WorkspacesPage.tsx`

- [x] Add a shared drawer component that supports both create and edit modes.
- [x] Add reusable controlled text field, text area, and checkbox components to simplify the form implementation.
- [x] Add form fields for workspace name and description.
- [x] Add activation state editing in edit mode and choose a sensible disabled/default behavior in create mode since the backend creates workspaces as active.
- [x] Wire submit state, cancel behavior, and optimistic UI affordances without losing form data on failure.
- [x] Surface backend validation failures, especially duplicate-name errors, in a clear form-level message.
- [x] Close the drawer and refresh the list after successful mutations.
- [x] Match the login page busy-button treatment for create and edit submits.

## Task 5: Finish Page Orchestration

**Files:**

- Modify: `src/OpenSaur.Identity.Web/client/src/pages/workspaces/WorkspacesPage.tsx`

- [x] Connect the list query, search filtering, create drawer, and edit drawer in the page container.
- [x] Move search and status filtering into a dedicated filter drawer that matches the create/edit drawer pattern.
- [x] Use the selected workspace id to trigger detail loading for edit mode.
- [x] Keep UI state local to the page: filter values, drawer state, and selected workspace id.
- [x] Update the page subtitle to describe the now-live workspace management surface.
- [x] Confirm the page still fits the existing protected app-shell route and navigation structure without changing unrelated shell behavior.

## Task 6: Add Frontend Tests

**Files:**

- Create: `src/OpenSaur.Identity.Web/client/src/pages/workspaces/WorkspacesPage.test.tsx`

- [x] Add tests for loading and populated list rendering.
- [x] Add tests for client-side search and status filtering.
- [x] Add a test covering create success.
- [x] Add a test covering edit success, including activation state updates.
- [x] Add a test covering backend validation failure display.
- [x] Add tests covering create/edit/filter busy indicators where the components own that behavior.
- [x] Add tests for empty-state and fetch-error rendering.
- [x] Use existing app-provider and mocking patterns already present in the auth/page tests.

## Task 7: Verify The Hosted Client Slice

**Files:**

- No additional files required unless fixes are found during verification.

- [x] Run `npm test` or the targeted Vitest command for the new workspace page coverage.
- [x] Run `npm run build` in `src/OpenSaur.Identity.Web/client`.
- [ ] Run the hosted app path if needed to sanity-check the `Workspaces` route in the real shell.
- [x] Record any verification-only fixes directly in the touched feature files.

## Notes

- Do not auto-commit as part of implementation unless the user explicitly asks.
- Keep the slice focused on listing, searching, creating, editing, and activation-state updates.
- Leave impersonation, details pages, pagination, and richer admin actions for later slices.
