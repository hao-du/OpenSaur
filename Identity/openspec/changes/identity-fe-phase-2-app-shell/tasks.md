## 1. Shell Foundation

- [x] 1.1 Add the authenticated app-shell template, top app bar, navigation structure, and shared route metadata for shell pages.
- [x] 1.2 Implement responsive desktop/tablet/mobile shell behavior with a permanent desktop sidebar and a collapsible tablet/mobile drawer.
- [x] 1.3 Move protected authenticated content to render through the new shell instead of the current single-page home layout.

## 2. Navigation And Routes

- [x] 2.1 Implement role-aware navigation visibility using the current authenticated user's roles.
- [x] 2.2 Add protected shell routes for `Dashboard`, `Workspace`, `Users`, and `Roles` with active navigation state.
- [x] 2.3 Implement clickable placeholder pages for `Workspace`, `Users`, and `Roles` with clear coming-soon messaging.

## 3. Dashboard And Verification

- [x] 3.1 Replace the current protected home content with an intentionally empty dashboard page inside the new shell.
- [x] 3.2 Add frontend tests covering role-aware navigation, responsive shell behavior, and placeholder-route rendering.
- [x] 3.3 Verify the shell flow through the hosted app build/run path and confirm navigation works on desktop, tablet, and mobile layouts.
