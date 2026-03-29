## ADDED Requirements

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
