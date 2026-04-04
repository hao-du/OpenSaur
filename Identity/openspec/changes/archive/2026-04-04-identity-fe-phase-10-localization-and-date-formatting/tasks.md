## 1. OpenSpec And Dependency Setup

- [x] 1.1 Add the phase 10 proposal, design, delta specs, and implementation tasks for app-wide localization and date formatting
- [x] 1.2 Add frontend dependencies and provider composition for `i18next`, `react-i18next`, `react-intl`, and MUI locale packs

## 2. Backend Error-Code Support

- [x] 2.1 Standardize stable auth helper error codes in the common `/api/auth/*` envelope path
- [x] 2.2 Standardize stable directory-management error codes in the common `/api/user/*`, `/api/role/*`, `/api/user-role/*`, and `/api/workspace/*` envelope path

## 3. Frontend Localization Infrastructure

- [x] 3.1 Replace the lightweight preference message map with shared i18next resources for `en-US` and `vi-VN`
- [x] 3.2 Add shared locale/timezone formatting helpers based on `react-intl`
- [x] 3.3 Wire the app providers so locale changes update i18next, MUI localization, and formatting context together
- [x] 3.4 Add frontend error-code translation helpers with English fallback behavior

## 4. Frontend Surface Migration

- [x] 4.1 Localize anonymous auth routes and account flows
- [x] 4.2 Localize the authenticated shell, dashboard, and account menu
- [x] 4.3 Localize workspaces, users, roles, role assignments, profile, and settings pages plus shared drawers/dialogs
- [x] 4.4 Apply locale/timezone-aware date and time rendering where the current hosted app displays user-facing temporal values

## 5. Verification

- [x] 5.1 Add or update frontend tests for locale switching, translated error rendering, and provider behavior
- [x] 5.2 Add or update backend tests for stable auth and directory-management error codes
- [x] 5.3 Run focused frontend/backend validation plus `npm run build`, `dotnet build`, and `openspec validate identity-fe-phase-10-localization-and-date-formatting`
