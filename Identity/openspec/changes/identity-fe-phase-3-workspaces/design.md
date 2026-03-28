# Workspaces Frontend Slice Design

## Summary

This slice turns the current placeholder `Workspaces` page into a real admin management surface backed by the existing workspace API. The first shipped version supports listing, filtering, creating, and editing workspaces, including activation status changes, while keeping future capabilities such as impersonation and deeper details visibly deferred.

## Goals

- Replace the current placeholder workspace screen with a backend-backed management page.
- Support real workspace discovery and maintenance from the frontend.
- Keep the user inside the authenticated app shell while creating or editing workspaces.
- Preserve room for future workspace capabilities without forcing a redesign of the page.
- Establish reusable frontend patterns for idempotent writes and controlled form fields.

## Non-Goals

- Workspace impersonation or login-as flows
- Workspace detail routes
- Server-side pagination and sorting
- Audit history
- Bulk actions

## User Experience

The `Workspaces` page lives inside the existing protected shell and follows the same visual language as the authenticated app shell.

The page header contains:

- The existing page title
- A concise management subtitle
- A `Filter` button that opens a right-side drawer for search and status filters
- A primary `Create workspace` action

The main content area contains a management table with:

- `Name`
- `Description`
- `Status`
- `Actions`

Search and status filtering are client-side against the fetched list for this slice. The filter UX lives in a dedicated drawer so future filters can be added without crowding the page header.

Create and edit actions open right-side drawers instead of full-page navigation or modal dialogs. This preserves list context, keeps the workflow fast, and leaves room for future fields or actions without overcrowding a modal.

Activation status is edited inside the edit form rather than inline from the table. That keeps the interaction deliberate and avoids accidental status changes.

New workspaces always start active, so create mode shows that state as informational copy rather than an editable checkbox.

Primary actions with network work should show inline busy indicators that match the login flow pattern.

The page may include disabled future-facing actions such as impersonation, but those must be visibly marked as unavailable rather than implied to work.

## Data Flow

This slice uses the existing backend endpoints under `/api/workspace`:

- `GET /api/workspace/get`
- `GET /api/workspace/getbyid/{id}`
- `POST /api/workspace/create`
- `PUT /api/workspace/edit`

Frontend behavior:

- TanStack Query owns the workspace list query.
- TanStack Query also owns selected workspace detail fetching for edit mode.
- Create and edit mutations invalidate or refetch workspace queries after success.
- Workspace create and edit requests opt into a shared Axios idempotency policy that injects an `Idempotency-Key` header.
- Local component state only tracks UI concerns such as active filters, drawer mode, and selected workspace id.

## Frontend Structure

Add a dedicated `workspaces` frontend feature slice under `src/OpenSaur.Identity.Web/client/src/features`.

Proposed responsibilities:

- `WorkspacesPage`
  - orchestrates search, drawer open/close state, and selected workspace id
- `WorkspaceTable`
  - renders loading, empty, error, and populated states
  - exposes row actions for edit and future placeholders
- `WorkspaceFormDrawer`
  - shared shell for create and edit workflows
- `WorkspaceForm`
  - contains fields, validation display, submit state, and status toggle
- `WorkspaceFiltersDrawer`
  - contains search and status filters in a matching drawer shell
- `workspaces/api`
  - wraps backend endpoints
- `workspaces/hooks` or `queries`
  - encapsulates query and mutation wiring
- `components/molecules/controlled`
  - provides shared controlled text field, text area, and checkbox primitives used by workspace forms

This mirrors the existing frontend structure instead of mixing workspace logic into the page file directly.

## Validation And Error Handling

The backend already validates workspace rules such as duplicate names. The frontend should surface those errors clearly.

Expected behaviors:

- Duplicate-name and other validation failures remain in the drawer and preserve entered values.
- Page-level list fetch failures show a retryable error state.
- Empty list state should be intentional and helpful, not a generic blank table.
- Mutation success closes the drawer and refreshes the list.

## Authorization Expectations

The app shell already restricts workspace navigation visibility to `SuperAdministrator` users, and the backend restricts create and edit operations accordingly.

This slice should align with those expectations:

- The route remains visible only for `SuperAdministrator` users through existing route metadata.
- The UI can assume workspace-management intent for authorized users.
- Backend authorization remains the source of truth for any rejected requests.

## Verification

Frontend verification should cover:

- Rendering a workspace list from query data
- Search and status filtering behavior
- Create success flow
- Edit success flow
- Activation status changes through edit
- Duplicate-name or validation failure handling
- Busy indicators for create/edit/filter actions
- Empty state rendering
- Fetch error rendering and retry path where applicable

Project verification should also include the client test/build path used by the hosted app.

## Implementation Boundaries

This slice should stop after:

- A real workspace list page
- Filter drawer with search and status filtering
- Create drawer
- Edit drawer
- Activation state updates

Future enhancements such as impersonation, details, pagination, or richer filtering should be left for later slices.
