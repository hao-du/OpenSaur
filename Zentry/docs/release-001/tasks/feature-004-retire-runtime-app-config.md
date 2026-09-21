# Feature 004: Retire Runtime App Config & Frontend Endpoint

## Description
Eliminate `window.__ZENTRY_CONFIG__`, `/app-config.js`, and `getConfig()` now that all OIDC parameters, client secrets, and authority endpoints are securely encapsulated within the Backend-For-Frontend (BFF).

---

## Tasks

### Item 1: Backend BFF Change-Password Endpoint
- [x] Implement `/bff/change-password` endpoint and handler in ASP.NET Core to redirect to CoreGate's password change URL.
- [x] Update `UserProfileMenu.tsx` to redirect to `/bff/change-password` instead of reading `getConfig().authority`.

### Item 2: Remove Frontend Runtime Config & Script Tag
- [x] Remove `src/infrastructure/config/Config.ts` and `src/infrastructure/config/dtos/ConfigDto.ts`.
- [x] Remove `<script src="/app-config.js"></script>` from `client/index.html` and `wwwroot/index.html`.
- [x] Remove `/app-config.js` proxy route from `client/vite.config.ts`.
- [x] Clean up any remaining references in dashboard or components.

### Item 3: Retire Backend App-Config Endpoint
- [x] Delete `CreateAppConfigJsHandler.cs` and `FrontentAppConfigJsDto.cs`.
- [x] Remove `/app-config.js` mapping from `FrontendEndpoints.cs` and DI registration in `Program.cs`.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[x]` will only be marked upon manual review and approval.

