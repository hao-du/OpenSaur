## ADDED Requirements

### Requirement: Authenticated shell SHALL expose real Profile and Settings routes
The hosted frontend SHALL replace the placeholder `My Profile` and `Settings` account-menu entries with real protected routes at `/profile` and `/settings`.

#### Scenario: Authenticated user opens the account menu
- **WHEN** an authenticated user opens the shell account menu
- **THEN** the `My Profile` entry navigates to `/profile`
- **AND** the `Settings` entry navigates to `/settings`

#### Scenario: Anonymous user cannot open profile or settings
- **WHEN** an anonymous user attempts to navigate directly to `/profile` or `/settings`
- **THEN** the frontend redirects the user through the existing authenticated-login flow

### Requirement: Profile page SHALL display read-only account context
The hosted frontend SHALL provide a read-only profile page for the current authenticated user that shows the effective account identity and context without allowing edits in this slice.

#### Scenario: Authenticated user opens Profile
- **WHEN** an authenticated user navigates to `/profile`
- **THEN** the page displays the current user's username, email, workspace display name, and effective roles
- **AND** the page does not expose editable form fields for core identity data

### Requirement: Settings page SHALL manage locale and timezone preferences
The hosted frontend SHALL provide a settings page where the current authenticated user can edit locale and timezone preferences.

#### Scenario: User opens Settings
- **WHEN** an authenticated user navigates to `/settings`
- **THEN** the page displays a locale selector with `English` and `Vietnamese`
- **AND** the page displays a searchable timezone selector using IANA timezone values

#### Scenario: User saves settings successfully
- **WHEN** an authenticated user saves valid locale and timezone values
- **THEN** the frontend updates its in-memory preference state
- **AND** the frontend updates browser local storage with the saved values
- **AND** the frontend reflects the saved values on the settings page

### Requirement: Anonymous login experience SHALL restore client preferences from local storage
The hosted frontend SHALL restore locale and timezone preferences from local storage before authentication so the login screen can use the last client-selected values on the same machine.

#### Scenario: Local settings exist on the current machine
- **WHEN** the login page loads and browser local storage contains locale and timezone values
- **THEN** the frontend uses those values before the user signs in

#### Scenario: No local settings exist
- **WHEN** the login page loads and browser local storage has no saved settings
- **THEN** the frontend defaults locale to `English`
- **AND** the frontend defaults timezone to the browser-detected IANA timezone when available

### Requirement: Authenticated bootstrap SHALL replace local defaults with DB-backed settings
The hosted frontend SHALL load the authenticated user's DB-backed settings after login or session bootstrap and SHALL treat those settings as authoritative over anonymous local defaults.

#### Scenario: User signs in on another machine
- **WHEN** the current machine has no local settings but the authenticated user has DB-backed locale and timezone values
- **THEN** the frontend first renders using the local defaults
- **AND** then replaces those defaults with the DB-backed settings after authenticated bootstrap completes
- **AND** the frontend writes the DB-backed settings into local storage
