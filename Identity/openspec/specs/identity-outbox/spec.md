# identity-outbox Specification

## Purpose
Define the outbox events that accompany identity-management writes so downstream consumers can process those changes reliably.
## Requirements
### Requirement: User, user-role, and role-permission assignment create/update operations SHALL record outbox events
The system SHALL write an outbox message in the same transaction as every successful create or update operation for users, user-role assignments, and role-permission assignments.

#### Scenario: User create writes outbox message
- **WHEN** the system successfully creates a user
- **THEN** it stores a `UserCreated` outbox message in the same transaction as the user record

#### Scenario: Role permission update writes outbox message
- **WHEN** the system successfully updates a role's assigned permissions
- **THEN** it stores a `RolePermissionsUpdated` outbox message in the same transaction as the role-permission assignment update

### Requirement: Soft delete SHALL emit update events instead of delete events
The system SHALL treat deactivation through `IsActive = false` as an update event and SHALL not emit delete events for soft-deleted records.

#### Scenario: User deactivation emits update event
- **WHEN** the system deactivates a user by editing `IsActive` to `false`
- **THEN** it stores a `UserUpdated` outbox message that reflects the inactive state

#### Scenario: User-role deactivation emits update event
- **WHEN** the system deactivates a user-role assignment by editing `IsActive` to `false`
- **THEN** it stores a `UserRoleUpdated` outbox message that reflects the inactive state

### Requirement: Outbox storage SHALL preserve publishable event details
The system SHALL store each outbox message with enough metadata to support later event publishing, retry, and troubleshooting workflows.

#### Scenario: Outbox row contains publish metadata
- **WHEN** the system stores an outbox message
- **THEN** the row includes an event name, aggregate type, aggregate identifier, serialized payload, occurrence timestamp, processing status information, and retry/error tracking fields

