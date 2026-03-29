## Context

The frontend already persists `locale` and `timeZone` preferences in local storage and the authenticated user settings store, but only the login/profile/settings surface reads from a small local message map. The rest of the client is still hard-coded English. The application also lacks one formatting layer for locale-aware dates and times, and backend-originated error text is English-only without stable identifiers that the frontend can translate.

## Goals / Non-Goals

**Goals:**
- Standardize all frontend text translation on `i18next`.
- Standardize all locale/timezone-aware formatting on `react-intl`.
- Apply MUI locale packs using the selected app locale.
- Use stable backend error codes so the frontend translates backend-originated failures without string matching.
- Keep UTC persistence unchanged in backend storage.

**Non-Goals:**
- Backend/server-rendered localization.
- Supporting more than `en-US` and `vi-VN` in this slice.
- Translating OpenIddict protocol responses under `/connect/*`.
- Reworking backend domain rules beyond adding stable error-code identifiers to existing envelope responses.

## Decisions

### Use `i18next` and `react-i18next` for all UI strings
- Recommended over extending the existing ad hoc message object because the app has moved beyond a small preferences surface.
- Recommended over using `react-intl` for both strings and formatting because the requested stack explicitly prefers `i18next` for translation.
- Translation resources will be split by locale and organized under the client app so features can add keys without growing one giant file.

### Use `react-intl` only for formatting
- `react-intl` will drive date, time, date-time, relative-time, and number formatting from the active locale plus saved IANA timezone.
- This avoids maintaining custom `Intl.*` wrappers throughout the app while keeping message translation in `i18next`.
- A small shared formatting layer will wrap `react-intl` so page code uses consistent helpers/components.

### Drive MUI localization from the same locale source
- The app theme/provider layer will map `en` to MUI `enUS` and `vi` to `viVN`.
- This keeps built-in MUI control labels aligned with translated app text.

### Introduce stable API error codes instead of translating raw English messages
- Existing auth and directory endpoints already return a common envelope with error objects.
- This slice will standardize and preserve `errors[].code` as the FE translation key for expected backend failures.
- English backend `message` and `detail` remain available as fallback/debug text, but FE translation will use the stable code first.

### Keep locale storage compact while expanding display locale
- Persisted backend/user-setting locale remains `en` or `vi`.
- Frontend maps those values to `en-US` and `vi-VN` for `i18next`, `react-intl`, and MUI localization.
- This avoids an unnecessary DB migration while still giving the client full locale identities.

## Risks / Trade-offs

- [Large UI surface] → Translate incrementally by feature and back changes with page-level/frontend tests for critical routes.
- [Mixed translation + formatting stacks] → Keep a strict boundary: `i18next` for strings, `react-intl` for formatting only.
- [Backend code drift] → Centralize shared error-code constants/helpers so auth and directory handlers do not invent ad hoc values.
- [Stale locale resources or cache issues] → Rebuild provider initialization so locale changes update i18n, MUI, and formatting providers together.

## Migration Plan

1. Add the new client dependencies and provider composition for `i18next`, `react-intl`, and MUI locale selection.
2. Introduce stable backend error-code coverage for auth and directory-management APIs.
3. Migrate shared shell/auth surfaces to translated strings first, then remaining admin pages and dialogs.
4. Replace the old preference message map once all current consumers are moved.
5. Validate with focused frontend tests, backend envelope tests, and a production client build.
