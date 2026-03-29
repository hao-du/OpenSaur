## Context

The protected shell already exposes `My Profile`, `Change password`, and `Settings` in the account menu, but only `Change password` has a real destination. The backend already has a JSON-backed `ApplicationUser.UserSettings` field, which is a better fit for account preferences than adding dedicated columns for locale and timezone. The new slice needs to support two different startup paths: anonymous login-screen restore from local storage on the current machine, and authenticated post-login restore from DB-backed user settings that work across devices.

## Goals / Non-Goals

**Goals:**
- Add real authenticated `Profile` and `Settings` routes to the shell.
- Make `Profile` a read-only account summary in this slice.
- Allow authenticated users to read and update locale and timezone preferences.
- Persist locale and timezone to both DB-backed user settings and browser local storage.
- Restore locale and timezone on the login screen from local storage before authentication.
- Override local defaults with DB-backed settings after authenticated bootstrap.
- Keep all backend datetimes stored and processed in UTC.

**Non-Goals:**
- Editing core profile identity data such as username, email, or workspace.
- Adding broad application preferences beyond locale and timezone.
- Changing backend datetime storage away from UTC.
- Introducing platform-specific timezone identifiers such as Windows timezone ids.

## Decisions

### Use `ApplicationUser.UserSettings` JSON for persisted preferences
Locale and timezone will be stored inside the existing JSON-backed `UserSettings` field instead of adding relational columns. This keeps the change small, avoids a schema expansion for two preference values, and matches the existing intent of per-user settings storage.

Alternatives considered:
- Add dedicated `Locale` and `TimeZone` columns to `Users`: rejected because the existing JSON settings field already covers this use case and the additional schema surface is not justified.

### Add dedicated authenticated settings helpers under `/api/auth`
The backend will expose a small authenticated settings read/write surface, for example `GET /api/auth/settings` and `PUT /api/auth/settings`, instead of overloading unrelated user-management APIs. This keeps current-user preference management aligned with the existing auth-helper pattern.

Alternatives considered:
- Extend `/api/auth/me` to become the write surface: rejected because `/me` is a read-oriented bootstrap endpoint.
- Reuse admin `Users` endpoints: rejected because self-service settings are not an admin-user-management concern.

### Use IANA timezones with browser detection and searchable selection
Timezone values will be stored as IANA strings such as `Asia/Ho_Chi_Minh`. The frontend will default to the browser-detected IANA timezone and present a searchable dropdown. The implementation should prefer built-in browser timezone lists where available and avoid introducing a heavy dependency just to enumerate timezone ids.

Alternatives considered:
- Windows timezone identifiers: rejected because the browser platform exposes IANA naturally and Windows ids add unnecessary translation complexity.
- Free-text timezone input: rejected because it is error-prone and weakens validation.

### Local storage is the pre-auth source; DB is the authenticated source of truth
Before authentication, the login page will restore locale and timezone from local storage so the same machine gets an immediate consistent experience. After authentication, the app will fetch DB-backed settings and apply them to the client state, updating local storage to match. This gives cross-device persistence without blocking the anonymous login experience on the server.

Alternatives considered:
- Use DB only: rejected because the login screen cannot rely on authenticated APIs.
- Use local storage only: rejected because settings would not follow the user across devices.

### Profile is read-only in this slice
`My Profile` will display account context only: username, email, workspace, effective roles, and current locale/timezone values. Editing identity fields is deferred to a later slice so this change stays focused on settings persistence and shell/account navigation.

Alternatives considered:
- Editable profile in the same slice: rejected because it expands the scope into identity-field validation, uniqueness, and additional account-management behavior.

## Risks / Trade-offs

- [Browser timezone enumeration varies by runtime] → Use browser detection first, prefer built-in `Intl` support, and provide a safe fallback list when full enumeration is unavailable.
- [Local storage and DB can temporarily disagree] → Treat DB as authoritative after authentication and overwrite local storage during settings bootstrap/save success.
- [Invalid or legacy timezone values may already exist in settings JSON] → Validate on read/write, fall back to browser/default values when stored values are invalid, and do not let invalid values break login or shell bootstrap.
- [Adding new `/api/auth/settings` endpoints expands auth-helper surface] → Keep the payload small and follow the same response envelope and authorization model used by the current auth helpers.

## Migration Plan

- No new relational schema is required if locale/timezone are stored inside `UserSettings` JSON.
- Existing users without locale/timezone values will fall back to English and browser-detected timezone on the client.
- Rollback is low-risk: the frontend can stop reading the settings API and local storage keys while leaving JSON data in place.

## Open Questions

- None for this slice. The scope is fixed to read-only profile plus editable locale/timezone settings.
