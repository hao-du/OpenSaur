# Feature 007: Angular Web UI

## Overview
Implement the modern, responsive Web UI in Angular 19+ (Standalone Components, Signals, `HttpClient`) using **Frontend Vertical Slice Architecture (`features/<slice>/`)** and an **Atomic Component Wrapper Layer (`components/atoms/`, `components/molecules/`, `components/organisms/`)** styled with CashPilot design tokens (Brand `#00ccff`, background `#edf3f8`, `"Be Vietnam Pro"` font, wrapped Angular Material / CDK primitives). All feature slices depend strictly on custom wrappers, shielding the application from third-party UI library lock-in.

---

## Tasks

- [x] 1. Initialize Angular 19 client in `src/OpenSaur.RuleAgent.Web/client`, configure CashPilot design tokens (`#00ccff`, `#edf3f8`, `"Be Vietnam Pro"`), Angular Material theme, and ASP.NET Core SPA hosting.
- [x] 2. Implement Design System Component Wrappers (`components/atoms/` & `components/organisms/`: `app-label`, `app-button`, `app-input`, `app-card`, `app-badge`, `app-icon`, `app-avatar`, `app-drawer`, `app-dialog`).
- [ ] 3. Implement Responsive Shell Layout (`components/organisms/`: Header with project switcher & UserProfileMenu, collapsible SideMenu, mobile navigation drawer).
- [ ] 4. Implement Projects & Permissions Vertical Slice (`features/projects/`, `features/project-permissions/`: Project list, create/edit drawer, Creator member permission dialog).
- [ ] 5. Implement Folder & File Explorer Vertical Slice (`features/explorer/`: CDK Tree wrapper, folder/file/shared icons, inline create, rename, move, and delete actions).
- [ ] 6. Implement Markdown Editor & Instruction Templates Vertical Slice (`features/editor/`, `features/templates/`: Monaco Editor wrapper with live saving, GFM preview, SuperAdmin template management).
- [ ] 7. Implement Snapshot History, Monaco Diff Viewer & File Sharing (`features/snapshots/`, `features/shared-files/`, `features/settings/`: Side-by-side diff viewer, approval workflow, shared files drawer, user settings page).
