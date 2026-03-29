## 1. Backend Settings Helpers

- [x] 1.1 Add authenticated current-user settings read/write endpoints for locale and timezone under `/api/auth`.
- [x] 1.2 Persist locale and timezone inside `ApplicationUser.UserSettings` with validation for `en`/`vi` locale values and valid IANA timezone values.
- [x] 1.3 Keep backend datetime persistence in UTC and add backend tests for valid saves, invalid saves, and persisted-read behavior.

## 2. Frontend Profile And Settings Pages

- [x] 2.1 Add protected `/profile` and `/settings` routes and wire the shell account-menu items to those routes.
- [x] 2.2 Implement the read-only Profile page showing current-user account context.
- [x] 2.3 Implement the Settings page with locale selector and searchable IANA timezone selector.

## 3. Client Preference State And Bootstrap

- [x] 3.1 Add client preference state and local-storage persistence for locale and timezone.
- [x] 3.2 Restore locale and browser-detected/default timezone on the login screen before authentication.
- [x] 3.3 Load DB-backed settings after authenticated bootstrap and override local defaults with the authenticated values.

## 4. Verification

- [x] 4.1 Add or update frontend tests for profile/settings routes, account-menu navigation, settings save flow, and login-screen local restore.
- [x] 4.2 Add or update backend tests for current-user settings read/write behavior and validation.
- [x] 4.3 Run targeted frontend tests, targeted backend tests, `npm run build`, `dotnet build`, and `openspec validate identity-fe-phase-8-profile-and-settings`.
