# identity-fe-workspaces Specification

## Purpose
Define the hosted workspaces management UI, filter behavior, and capacity-aware workspace summaries.
## Requirements
### Requirement: Workspace management SHALL default the status filter to Active
The frontend workspace management page SHALL default its status filter to `Active` when the route first loads and when filters are reset.

#### Scenario: Workspace page first loads
- **WHEN** a `SuperAdministrator` opens the `Workspaces` page
- **THEN** the status filter defaults to `Active`
- **AND** the list initially renders only active workspaces unless the user changes the filter

#### Scenario: User resets workspace filters
- **WHEN** the user resets filters from the workspace filter drawer
- **THEN** the status filter resets to `Active`
- **AND** the search filter resets to blank

### Requirement: Workspace management SHALL preserve applied filters across successful saves
The frontend workspace management page SHALL preserve its current filter state after successful create and edit saves so the refreshed list remains in the user's current working context.

#### Scenario: User saves while a non-default filter is active
- **WHEN** the user has changed workspace filters and successfully creates or edits a workspace
- **THEN** the page refreshes the workspace list without clearing the applied filters
- **AND** the rendered rows still respect the active filter state after the refresh

### Requirement: Workspace list filtering behavior SHALL define the admin-list pattern baseline
The workspace management slice SHALL establish the baseline list-filter behavior for future admin management pages.

#### Scenario: Future admin list slices follow the same interaction pattern
- **WHEN** later frontend slices implement `Users` and `Roles` management pages
- **THEN** those pages follow the same pattern of defaulting the primary status filter to `Active`
- **AND** they preserve applied filters after successful create or edit saves unless a later approved change explicitly overrides that behavior

### Requirement: Workspace management SHALL store an optional maximum active-user limit
Workspace management SHALL let admins store a nullable maximum number of active users per workspace, where `null` means unlimited.

#### Scenario: Admin creates or edits a workspace with no limit
- **WHEN** the caller leaves the maximum active-user field blank
- **THEN** the workspace stores a `null` limit
- **AND** the workspace is treated as unlimited for future user-capacity checks

#### Scenario: Admin lowers limit below current active usage
- **WHEN** the caller saves a workspace with a new maximum that is lower than the current count of active users
- **THEN** the save succeeds
- **AND** the existing active users remain active
- **AND** later create or reactivation actions are blocked until the active count drops below the limit

### Requirement: Workspace list SHALL preview assigned roles inline
The workspace management list SHALL surface the roles assigned to each workspace using a compact inline preview.

#### Scenario: Workspace has up to two assigned roles
- **WHEN** a workspace row has one or two assigned roles
- **THEN** the list shows those roles inline in the `Roles` column

#### Scenario: Workspace has more than two assigned roles
- **WHEN** a workspace row has more than two assigned roles
- **THEN** the list shows only the first two roles inline
- **AND** the list shows a `+N` overflow indicator
- **AND** selecting the overflow indicator reveals the remaining roles in a popover

