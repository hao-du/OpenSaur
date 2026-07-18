# Zentry OIDC Client CRUD Design

## Goal

Implement full OIDC client CRUD in Zentry based on Identity’s existing feature, while exposing it as a management page inside Zentry’s current application shell.

## Scope

Included:
- backend OIDC client CRUD endpoints in Zentry
- request validation and metadata mapping aligned with Identity
- OpenIddict application create/read/update/deactivate behavior
- super-admin-only backend access control
- Zentry frontend list/create/edit/deactivate UI for OIDC clients
- page routing and shell navigation inside the existing Zentry app

Excluded:
- catalog/seeding work
- broad auth or authorization-system redesign
- migration execution
- unrelated admin areas such as users/roles/workspaces

## Architecture

### Backend

Add a new backend feature slice under `Features/OidcClients` in Zentry mirroring Identity’s OIDC client management logic:
- endpoint mapping
- metadata mapping helpers
- normalization helpers
- create/edit/delete/get handlers
- request/response DTOs
- FluentValidation validators

Use Zentry’s `ApplicationDbContext` and OpenIddict EF entities directly. Preserve Identity’s behavior for:
- app path base normalization
- callback path normalization
- origin normalization/conflict checks
- post-logout path handling
- inactive-client soft deactivation via `IsActive = false`

### Authorization

Restrict the CRUD endpoints to super-admin-only access.

Since Zentry does not have Identity’s full authorization stack, implement the minimum Zentry-local guard needed for this feature:
- authenticate the current CoreGate-backed user
- inspect claims/roles from the current session
- allow only users carrying the super-admin role value used by the shared identity model

Keep this authorization surface narrow and feature-scoped rather than importing Identity’s broader authorization infrastructure.

### Frontend

Add a new Zentry management page that lives inside the existing app shell and route tree.

Mirror Identity’s OIDC client management UX and data flow:
- list all OIDC clients
- filter by client id and status
- open create and edit drawers/forms
- deactivate a client
- show redirect URIs and post-logout redirect URIs in the list
- preserve the same field set and form semantics as Identity where practical

Adapt the page composition to Zentry’s existing shell and navigation rather than copying Identity’s shell verbatim.

## Data and Behavior Parity

Preserve the Identity-side OIDC client model semantics:
- `AppPathBase`
- `CallbackPath`
- `ClientId`
- `ClientSecret`
- `Description`
- `DisplayName`
- `IsActive`
- `Origins`
- `PostLogoutPath`
- `Scope`

Preserve OpenIddict descriptor behavior:
- authorization and token endpoints
- authorization code + refresh token grants
- code response type
- scope permissions
- end-session permission when post-logout URIs exist

## Risks

Zentry currently lacks Identity’s general-purpose localization, API response wrapper, and authorization helper stack. Porting should therefore favor feature-local equivalents over trying to import those entire systems wholesale.

The main risk is accidentally coupling Zentry to Identity-only helper layers. The implementation should keep the feature self-contained and reuse Zentry’s existing page shell and frontend patterns where possible.

## Verification

- backend build succeeds for `OpenSaur.Zentry.Web`
- frontend build succeeds with `npm run build-dev`
- manual verification confirms only super-admin users can access the page and API
- manual verification confirms list/create/edit/deactivate flows behave like Identity’s OIDC client management
