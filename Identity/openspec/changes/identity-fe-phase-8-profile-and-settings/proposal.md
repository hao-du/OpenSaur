## Why

The account menu still contains placeholder `My Profile` and `Settings` entries, so authenticated users have no real way to review their account context or manage locale and timezone preferences. Locale and timezone are now needed to support a consistent login experience on the same machine through local restore and a consistent signed-in experience across devices through DB-backed preference sync.

## What Changes

- Add a real read-only `My Profile` page for the current authenticated user.
- Add a real `Settings` page where users can manage locale and timezone preferences.
- Persist locale and timezone to both local storage and the authenticated user's DB-backed settings.
- Restore locale and timezone from local storage on the login screen before authentication.
- Load authenticated user settings after login/bootstrap and override client defaults with DB-backed values.
- Use a searchable IANA timezone selector with browser-detected default timezone.
- Keep all persisted backend datetimes in UTC; timezone remains a display/user-preference concern only.

## Capabilities

### New Capabilities
- `identity-fe-profile-settings`: Frontend profile and settings routes, UI, and client-side preference persistence/restore behavior.

### Modified Capabilities
- `identity-authentication`: Current-user bootstrap and authenticated settings persistence for locale/timezone preferences.

## Impact

- Frontend routes, account-menu navigation, and protected-shell UX
- Auth/bootstrap state handling on the login page and after authenticated session restore
- Backend current-user and settings APIs for the authenticated user
- User settings persistence using the existing DB-backed user settings storage
