# Zentry Identity Shell Port Design

## Goal

Port the common frontend shell from `Identity` into `Zentry` so the Zentry SPA uses the same visual language, layout chrome, and shared component patterns for authenticated pages while preserving Zentry's existing SPA authentication flow.

This work is about the common application frame only. It does not include porting `Identity` feature screens such as user CRUD, workspace CRUD, role management, or other business modules.

## Scope

### In Scope

- Port the `Identity` visual theme and MUI styling baseline into `Zentry`.
- Port the common authenticated shell layout:
  - header/app bar
  - side navigation drawer
  - main workspace/content area
  - shell account menu
- Port the shared visual primitives needed to support the shell:
  - branded header elements
  - button styling
  - section/card surfaces
  - page action and content framing patterns
- Update Zentry's current protected page rendering so authenticated pages use the new shell.
- Restyle Zentry's existing auth-facing pages so they feel consistent with the shell design system.
- Keep the current Zentry auth/session/token flow as the source of truth.

### Out of Scope

- Porting any `Identity` CRUD pages or admin workflows.
- Porting `Identity`-specific data hooks, API clients, or feature state.
- Creating shared packages between `Identity` and `Zentry`.
- Reworking Zentry's backend host architecture.
- Adding frontend or backend unit tests, integration tests, or automation tests.

## Design Approach

Use a direct shell port with light adaptation.

`Zentry` should copy the overall shell structure from `Identity` almost 1:1 so the resulting app feels immediately familiar:

- same theme direction
- same shell composition
- same component styling language
- same responsive navigation behavior

The adaptation layer should be narrow and intentional:

- replace `Identity` branding with `Zentry`
- bind shell user/session actions to Zentry's auth state and logout flow
- trim any `Identity`-only shell concerns that require business features Zentry does not yet have
- reduce route/navigation entries to the pages that exist today or are needed as placeholders

This keeps the user-facing result close to `Identity` without dragging over unrelated application logic.

## Architecture

The port should introduce a small app-shell structure inside `src/OpenSaur.Zentry.Web/client/src`:

- `app/`
  - app-level providers
  - theme creation
  - route assembly for shell and public pages
- `components/`
  - shared shell template
  - account menu
  - brand mark/header elements
  - reusable layout primitives
- `pages/`
  - existing auth callback and auth-required pages, restyled
  - dashboard/home page rendered inside the shell
- `auth/`
  - remains the source of truth for token/session behavior

The authenticated shell should be a layout wrapper, not a feature container. Pages render into it through routing, and the shell itself only owns:

- navigation rendering
- header actions
- responsive drawer behavior
- common page spacing and framing

## Routing Model

Routing should split cleanly into two groups:

- public/auth-related pages outside the shell
- authenticated pages inside the protected shell

Expected initial route behavior:

- `/auth/callback` stays public and processes the OIDC return
- `/auth-required` stays public and presents the unauthenticated state
- `/` renders the protected dashboard inside the shell

If future routes are added soon, the shell navigation can include them as placeholders only if they lead to simple holding pages. It should not imply that CRUD features already exist.

## Theme And Visual System

The visual direction should intentionally match `Identity`:

- MUI theme with the same palette family and base styling behavior
- matching typography feel
- matching border radius and surface treatment
- matching navigation, app bar, and content spacing

The shell should preserve the polished `Identity` feel:

- sticky translucent app bar
- left navigation rail/drawer
- soft background contrast between app frame and content surfaces
- button and card styles that look like the same product family

Branding should still say `Zentry`, but the interaction feel should remain very close to `Identity`.

## Session Integration

Zentry's current auth/session flow remains authoritative.

The shell should integrate with existing Zentry auth behavior for:

- current user display in the header/account menu
- logout action
- protected route access
- transition into authenticated content after callback success

This port must not replace the OIDC flow with a different auth mechanism. The shell is a presentation and navigation layer on top of the existing SPA auth implementation.

## Shared Component Boundaries

The first pass should port only the common shell-related components that create leverage for future pages.

Required now:

- app theme/provider setup
- shell layout template
- shell account menu
- brand mark/header block
- common page container and section/card wrappers
- common button styling through the theme and shared usage patterns

Deferred until requested:

- tables and CRUD-specific toolbars
- form-heavy feature components
- feature-specific dialogs and workflows

This keeps the initial port focused and avoids bringing over unused complexity.

## Error Handling

The shell port should preserve existing auth error behavior while making it visually consistent with the new design system.

Key cases:

- if no valid auth session exists, the protected route behavior still redirects or lands on the existing unauthenticated path
- if current user data is temporarily unavailable, the shell should avoid crashing and render a safe loading or empty header state
- logout should continue clearing local auth state even if upstream provider logout has issues

The new shell should not introduce route loops or duplicate callback execution. Existing auth flow safeguards remain in place.

## Verification

Do not add unit tests or automation tests.

Verification for this work is manual and build-based:

- `npm run build` for `src/OpenSaur.Zentry.Web/client`
- `dotnet build` for the Zentry solution
- manual runtime check of:
  - unauthenticated redirect behavior
  - successful login landing in the new shell
  - header and side menu rendering
  - logout behavior
  - responsive drawer behavior on narrow screens
  - auth callback and auth-required pages matching the updated styling

## Success Criteria

This work is successful when:

- authenticated Zentry pages render inside an `Identity`-style shell
- the shell includes header, side menu, main workspace, and account actions
- the theme and shared component styling clearly match the `Identity` product family
- Zentry's current SPA login, callback, and logout flow still work
- auth-facing pages no longer feel visually disconnected from the protected shell
- no CRUD features are ported as part of this task

## Deferred Work

These follow-up items should be requested separately:

- user CRUD pages
- workspace CRUD pages
- roles/permissions management screens
- deeper shared component extraction between apps
- richer data display components once feature pages are requested
