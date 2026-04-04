# identity-fe-localization Specification

## Purpose
Define app-wide localization, translated UI resources, localized formatting, and backend error-code translation behavior for the hosted Identity frontend.

## Requirements
### Requirement: Hosted frontend SHALL localize the entire current app surface
The hosted frontend SHALL translate the entire current first-party application surface for `en-US` and `vi-VN`, including anonymous auth routes, the authenticated shell, dashboard, workspaces, users, roles, role assignments, profile, settings, dialogs, drawers, filters, validation feedback, and action labels.

#### Scenario: User selects Vietnamese
- **WHEN** the current app locale is `vi`
- **THEN** the rendered frontend text uses Vietnamese across the current hosted app surface
- **AND** the user does not need to refresh the browser to see the language switch

#### Scenario: User selects English
- **WHEN** the current app locale is `en`
- **THEN** the rendered frontend text uses English across the current hosted app surface

### Requirement: Hosted frontend SHALL use i18next for application message translation
The hosted frontend SHALL use `i18next` and `react-i18next` as the application message system and SHALL not rely on ad hoc per-feature message maps for translated UI text.

#### Scenario: Feature UI renders a translated label
- **WHEN** any hosted frontend page or shared component renders a translated UI label
- **THEN** that label resolves through the shared i18next resource system for the active locale

### Requirement: Hosted frontend SHALL use locale-aware client formatting for dates and times
The hosted frontend SHALL format dates, times, date-times, relative times, and numbers on the client using the active locale and saved IANA timezone preference while keeping backend persistence in UTC.

#### Scenario: User views a UTC-backed timestamp
- **WHEN** the frontend renders a timestamp sourced from UTC-backed backend data
- **THEN** the value is formatted in the current user's saved timezone
- **AND** the formatting follows the active locale conventions

### Requirement: Hosted frontend SHALL localize MUI built-in component text
The hosted frontend SHALL apply the matching MUI locale pack for the active application locale so built-in MUI component text follows the selected language.

#### Scenario: User opens a MUI component with built-in localized text
- **WHEN** the active locale is `vi`
- **THEN** the frontend uses the MUI `vi-VN` localization pack for built-in component text

#### Scenario: User switches back to English
- **WHEN** the active locale is `en`
- **THEN** the frontend uses the MUI `en-US` localization pack for built-in component text

### Requirement: Frontend SHALL translate backend-originated failures from stable error codes
The hosted frontend SHALL translate backend-originated auth and directory-management failures from stable API error codes instead of matching raw English backend text.

#### Scenario: Backend returns a known error code
- **WHEN** an auth or directory-management API response includes a known stable error code
- **THEN** the frontend renders the localized error text for that code in the active locale

#### Scenario: Backend returns an unknown error code
- **WHEN** the frontend receives an auth or directory-management error code that has no localized mapping
- **THEN** the frontend falls back to the backend-provided English text instead of showing a blank message
