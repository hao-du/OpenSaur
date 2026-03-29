## ADDED Requirements

### Requirement: User management SHALL enforce the workspace maximum active-user limit
User management SHALL prevent operations that would increase the active-user count above the current workspace limit.

#### Scenario: Caller creates a user when capacity is available
- **WHEN** the current workspace has remaining active-user capacity or no configured limit
- **THEN** the caller can create a new active user

#### Scenario: Caller creates a user when capacity is exhausted
- **WHEN** the current workspace has a configured active-user limit and the active-user count is already at that limit
- **THEN** the caller cannot create a new active user
- **AND** the system returns a validation error explaining that the workspace user limit has been reached

#### Scenario: Caller reactivates an inactive user when capacity is exhausted
- **WHEN** the current workspace has a configured active-user limit and the active-user count is already at that limit
- **AND** the caller edits an inactive user and changes them to active
- **THEN** the save is rejected with a validation error explaining that the workspace user limit has been reached

#### Scenario: Caller edits an already-active user while workspace is over limit
- **WHEN** the current workspace is already above its configured active-user limit because of a prior workspace-limit change
- **AND** the caller edits an already-active user without deactivating or reactivating them
- **THEN** the save remains allowed

### Requirement: User list SHALL preview assigned roles inline
The user management list SHALL surface each user's assigned roles using the same compact preview pattern as the workspace list.

#### Scenario: User has up to two assigned roles
- **WHEN** a user row has one or two assigned roles
- **THEN** the list shows those roles inline in the `Roles` column

#### Scenario: User has more than two assigned roles
- **WHEN** a user row has more than two assigned roles
- **THEN** the list shows only the first two roles inline
- **AND** the list shows a `+N` overflow indicator
- **AND** selecting the overflow indicator reveals the remaining roles in a popover
