# Feature 003: Retire Runtime App Config & Frontend Endpoint

## Description
Eliminate `window.__CASHPILOT_CONFIG__`, `/app-config.js`, and `getConfig()` now that OIDC parameters, client IDs, and authority endpoints are encapsulated within the BFF. Simplify SPA hosting by replacing explicit route enumeration with `MapFallbackToFile("index.html")`.

---

## Tasks

### Item 1: Remove Frontend Runtime Config & Script Tag
- [x] Remove `src/infrastructure/config/Config.ts` and `src/infrastructure/config/dtos/ConfigDto.ts`.
- [x] Remove `<script src="/app-config.js"></script>` from `client/index.html` and `wwwroot/index.html`.
- [x] Delete `wwwroot/app-config.js`.
- [x] Remove any `getConfig()` usages in client (`SettingsPage.tsx`, `client.ts`, etc.).

### Item 2: Retire Backend App-Config Endpoint & Handler
- [x] Delete `CreateAppConfigJsHandler.cs` and `FrontentAppConfigJsDto.cs`.
- [x] Remove `/app-config.js` mapping from `FrontendEndpoints.cs` and DI registration in `Program.cs`.

### Item 3: Replace Explicit Route Handler with Fallback
- [x] Replace custom `CreateFrontendRouteHandler.cs` and hardcoded routes in `FrontendEndpoints.cs` with `app.MapFallbackToFile("index.html")`.
- [x] Remove `CreateFrontendRouteHandler` DI registration in `Program.cs` and delete `CreateFrontendRouteHandler.cs`.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.

