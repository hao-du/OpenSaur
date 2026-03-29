## Why

The hosted admin app currently mixes a small preference-only message catalog with hard-coded English UI across the rest of the client. Locale and timezone preferences already exist, but they do not drive full-app translation, MUI component localization, or consistent client-side date and time formatting.

## What Changes

- Replace the current lightweight preference message system with app-wide localization using `i18next` and `react-i18next`.
- Add client-side locale and timezone-aware formatting using `react-intl` for dates, times, relative times, and numbers.
- Apply MUI locale packs so built-in MUI component strings follow the selected app language.
- Translate the entire current hosted frontend surface for `en-US` and `vi-VN`, including anonymous auth routes, protected admin pages, shell navigation, drawers, filters, dialogs, validation text, and alerts.
- Introduce stable API error codes for auth and directory-management endpoints so the frontend can translate backend-originated failures without matching raw English strings.

## Capabilities

### New Capabilities
- `identity-fe-localization`: App-wide message translation, locale-aware client formatting, and MUI locale integration for the hosted frontend.

### Modified Capabilities
- `identity-authentication`: Auth helper endpoints return stable error codes that the frontend can translate, while login/bootstrap flows honor the selected client locale.
- `identity-directory-management`: Directory-management endpoints return stable error codes that the frontend can translate consistently.
- `identity-fe-profile-settings`: Settings become the source of truth for app-wide locale/timezone behavior instead of only the profile/settings surface.

## Impact

- Affected frontend code spans app providers, auth flows, shell, all current admin pages, shared components, validation messages, and date/time rendering helpers.
- New frontend dependencies: `i18next`, `react-i18next`, and `react-intl`.
- Backend impact is limited to stable error-code coverage in existing application response envelopes for auth and directory endpoints.
