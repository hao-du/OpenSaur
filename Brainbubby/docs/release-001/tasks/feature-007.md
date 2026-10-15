# Feature 007: Angular Web UI

## Overview
Implement the modern, responsive Web UI in Angular 19+ (Standalone Components, Signals, `HttpClient`) using **Frontend Vertical Slice Architecture (`features/<slice>/`)** and an **Atomic Component Wrapper Layer (`components/atoms/`, `components/molecules/`, `components/organisms/`)** styled with CashPilot design tokens (Brand `#00ccff`, background `#edf3f8`, `"Be Vietnam Pro"` font, wrapped Angular Material / CDK primitives). All feature slices depend strictly on custom wrappers, shielding the application from third-party UI library lock-in.

---

## Tasks

- [x] 1. Initialize Angular 19 client in `src/OpenSaur.Brainbubby.Web/client`, configure CashPilot design tokens (`#00ccff`, `#edf3f8`, `"Be Vietnam Pro"`), Angular Material theme, and ASP.NET Core SPA hosting.
- [x] 2. Implement Design System Component Wrappers (`components/atoms/` & `components/organisms/`: `app-label`, `app-button`, `app-input`, `app-card`, `app-badge`, `app-icon`, `app-avatar`, `app-drawer`, `app-dialog`).
- [x] 3. Implement Responsive Shell Layout (`components/organisms/`: Header with project switcher & UserProfileMenu, collapsible SideMenu, mobile navigation drawer).
- [ ] 4. Refactor Projects Modular Sub-Components:
  - [ ] 4.1. Extract Project Filter Drawer (`features/projects/components/project-filter-drawer/`) to decouple filtering from `ProjectListComponent`.
- [ ] 5. Implement Folder & File Explorer Vertical Slice (`features/explorer/`: CDK Tree wrapper, folder/file/shared icons, inline create, rename, move, and delete actions).
- [ ] 6. Implement Instruction Templates Vertical Slice (`features/templates/`):
  - [x] 6.1. Template Data Models & API Service Layer (`models/template.model.ts`, `services/template.service.ts` consuming `/api/templates`).
  - [ ] 6.2. Template Filter Drawer Sub-Component (`components/template-filter-drawer/` matching project filter layout).
  - [ ] 6.3. Template Create & Edit Drawer Sub-Component (`components/template-drawer/`).
  - [ ] 6.4. Template List Component & Navigation Page (`components/template-list/` matching project-list structure with `/templates` route).
- [ ] 7. Implement Markdown Editor Vertical Slice (`features/editor/`: Monaco Editor wrapper with live saving, GFM preview).
- [ ] 8. Implement Snapshot History, Monaco Diff Viewer & File Sharing (`features/snapshots/`, `features/shared-files/`, `features/settings/`: Side-by-side diff viewer, approval workflow, shared files drawer, user settings page).

