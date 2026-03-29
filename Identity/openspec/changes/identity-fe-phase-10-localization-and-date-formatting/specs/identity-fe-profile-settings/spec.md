## MODIFIED Requirements

### Requirement: Settings page SHALL manage locale and timezone preferences
The hosted frontend SHALL provide a settings page where the current authenticated user can edit locale and timezone preferences, and those preferences SHALL drive the entire hosted frontend experience.

#### Scenario: User opens Settings
- **WHEN** an authenticated user navigates to `/settings`
- **THEN** the page displays a locale selector with `English (United States)` and `Vietnamese`
- **AND** the page displays a searchable timezone selector using IANA timezone values

#### Scenario: User saves settings successfully
- **WHEN** an authenticated user saves valid locale and timezone values
- **THEN** the frontend updates its in-memory preference state
- **AND** the frontend updates browser local storage with the saved values
- **AND** the frontend reflects the saved values across the hosted app without requiring a browser refresh
- **AND** the frontend applies the corresponding application language, MUI locale, and formatting locale/timezone

### Requirement: Anonymous login experience SHALL restore client preferences from local storage
The hosted frontend SHALL restore locale and timezone preferences from local storage before authentication so the login screen can use the last client-selected values on the same machine.

#### Scenario: Local settings exist on the current machine
- **WHEN** the login page loads and browser local storage contains locale and timezone values
- **THEN** the frontend uses those values before the user signs in
- **AND** the login page renders in the restored locale

#### Scenario: No local settings exist
- **WHEN** the login page loads and browser local storage has no saved settings
- **THEN** the frontend defaults locale to `English (United States)`
- **AND** the frontend defaults timezone to the browser-detected IANA timezone when available

### Requirement: Authenticated bootstrap SHALL replace local defaults with DB-backed settings
The hosted frontend SHALL load the authenticated user's DB-backed settings after login or session bootstrap and SHALL treat those settings as authoritative over anonymous local defaults.

#### Scenario: User signs in on another machine
- **WHEN** the current machine has no local settings but the authenticated user has DB-backed locale and timezone values
- **THEN** the frontend first renders using the local defaults
- **AND** then replaces those defaults with the DB-backed settings after authenticated bootstrap completes
- **AND** the frontend writes the DB-backed settings into local storage
- **AND** the hosted app re-renders in the DB-backed locale/timezone without a manual refresh
