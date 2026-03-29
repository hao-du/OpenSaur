## ADDED Requirements

### Requirement: Authenticated user settings helpers SHALL read and persist locale and timezone preferences
The system SHALL expose authenticated helper endpoints for the current user's locale and timezone preferences, SHALL persist those preferences in the user's DB-backed settings storage, and SHALL validate locale and timezone values before saving them.

#### Scenario: Authenticated user reads current settings
- **WHEN** an authenticated user requests the current-user settings helper
- **THEN** the system returns the user's persisted locale and timezone values when present
- **AND** the response remains scoped to the current authenticated user only

#### Scenario: Authenticated user saves valid settings
- **WHEN** an authenticated user submits a valid locale of `en` or `vi` and a valid IANA timezone value
- **THEN** the system persists those settings for the authenticated user
- **AND** subsequent authenticated settings reads return the saved values

#### Scenario: Invalid locale or timezone is rejected
- **WHEN** an authenticated user submits an unsupported locale or an invalid timezone value
- **THEN** the system rejects the request through the common application JSON envelope
- **AND** the previously persisted settings remain unchanged

### Requirement: Backend datetime persistence SHALL remain UTC while honoring user timezone preferences for display only
The system SHALL keep backend datetime persistence in UTC and SHALL treat the saved user timezone only as a client/display preference.

#### Scenario: User changes timezone preference
- **WHEN** an authenticated user updates the saved timezone preference
- **THEN** the system stores the timezone identifier as a user setting
- **AND** the system does not convert persisted backend datetimes away from UTC
