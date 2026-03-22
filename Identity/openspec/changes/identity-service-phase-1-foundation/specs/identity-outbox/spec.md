## ADDED Requirements

### Requirement: User, user-role, and permission create/update operations SHALL record outbox events
The system SHALL write an outbox message in the same transaction as every successful create or update operation for users, user-role assignments, and permissions.

#### Scenario: User create writes outbox message
- **WHEN** the system successfully creates a user
- **THEN** it stores a `UserCreated` outbox message in the same transaction as the user record

#### Scenario: Permission update writes outbox message
- **WHEN** the system successfully updates a permission
- **THEN** it stores a `PermissionUpdated` outbox message in the same transaction as the permission update

### Requirement: Soft delete SHALL emit update events instead of delete events
The system SHALL treat deactivation through `IsActive = false` as an update event and SHALL not emit delete events for soft-deleted records.

#### Scenario: User deactivation emits update event
- **WHEN** the system deactivates a user by editing `IsActive` to `false`
- **THEN** it stores a `UserUpdated` outbox message that reflects the inactive state

### Requirement: Outbox storage SHALL preserve publishable event details
The system SHALL store each outbox message with enough metadata to support later event publishing, retry, and troubleshooting workflows.

#### Scenario: Outbox row contains publish metadata
- **WHEN** the system stores an outbox message
- **THEN** the row includes an event name, aggregate type, aggregate identifier, serialized payload, occurrence timestamp, processing status information, and retry/error tracking fields
