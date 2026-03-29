# identity-fe-workspaces Specification

## Purpose
TBD - created by archiving change identity-fe-phase-3-workspaces. Update Purpose after archive.
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

