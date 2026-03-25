## ADDED Requirements

### Requirement: First-party web SHALL be served from the identity host on the same domain
The system SHALL provide a first-party React web app under the identity service host, where `/api/*` remains backend API traffic and non-API routes are served by the frontend application. The frontend source SHALL live under `src/OpenSaur.Identity.Web/client`, SHALL use Vite for development, and SHALL be served by ASP.NET Core from built assets in same-host deployment.

#### Scenario: Browser requests a web route
- **WHEN** a browser requests a non-API first-party route such as `/login`, `/auth/callback`, `/change-password`, or `/`
- **THEN** the identity host serves the frontend application for that route instead of treating it as an API endpoint

#### Scenario: Browser requests an API route
- **WHEN** a browser or client requests `/api/*`
- **THEN** the identity host routes that request to the backend API surface instead of the frontend application

### Requirement: Frontend auth-only phase SHALL expose the minimal route set
The first frontend phase SHALL expose an auth-only route set consisting of `/login`, `/auth/callback`, `/change-password`, and one protected shell route.

#### Scenario: Anonymous user opens the login page
- **WHEN** an anonymous user navigates to `/login`
- **THEN** the system renders the login UI without requiring a prior authenticated session

#### Scenario: Authenticated user opens the protected shell
- **WHEN** a user with a valid first-party session navigates to the protected shell route
- **THEN** the system renders the protected shell instead of redirecting back to login

### Requirement: Login UI SHALL redirect the user back to the requested page after successful authentication
The frontend login flow SHALL preserve the originally requested protected route and SHALL return the user to that route after successful login and callback completion.

#### Scenario: User is redirected to login from a protected route
- **WHEN** an anonymous user attempts to open a protected route
- **THEN** the frontend redirects the user to `/login` and preserves the original route as `returnUrl`

#### Scenario: Successful login returns the user to the previous page
- **WHEN** the user completes login and the first-party callback succeeds
- **THEN** the frontend navigates the user back to the preserved `returnUrl` instead of leaving the user on the login or callback page

### Requirement: First-party frontend SHALL receive and use JWT access tokens
The first-party frontend SHALL complete the authorization-code flow and SHALL receive a JWT access token for authenticated API access after successful callback handling.

#### Scenario: Callback completes successfully
- **WHEN** the frontend receives a valid first-party authorization callback
- **THEN** the frontend obtains a JWT access token and uses it for subsequent protected API requests

### Requirement: Frontend SHALL refresh access tokens before expiry without re-prompting the user
The frontend SHALL monitor access-token expiry, SHALL check the server for a still-valid session before expiry, and SHALL use the refresh path to obtain a replacement access token before the current token expires when the server still accepts the session.

#### Scenario: Access token is still refreshable before expiry
- **WHEN** the current access token approaches expiry and the backend still accepts the refresh/session path
- **THEN** the frontend obtains a replacement access token without interrupting the user with a fresh login prompt

### Requirement: Expired or invalid auth state SHALL return the user to login
The frontend SHALL clear its auth state and SHALL redirect the user to `/login` when the access token is expired and the backend no longer accepts refresh or session recovery.

#### Scenario: Refresh fails for the current protected route
- **WHEN** the frontend cannot refresh or re-bootstrap a valid access token for the current protected route
- **THEN** the frontend clears auth state and redirects the user to `/login` with the current route preserved as `returnUrl`

### Requirement: Password-rotation flow SHALL be enforced in the frontend
The frontend SHALL redirect users who require password rotation to `/change-password` and SHALL require a fresh authenticated callback flow after a successful password change before returning the user to protected content.

#### Scenario: Bootstrap or password-change-required user enters the app
- **WHEN** frontend session bootstrap indicates `RequirePasswordChange = true`
- **THEN** the frontend redirects the user to `/change-password` instead of allowing access to the protected shell

#### Scenario: Password change succeeds
- **WHEN** the user successfully changes their password
- **THEN** the frontend sends the user through a fresh login/callback cycle before returning them to the protected route they were trying to reach

### Requirement: Frontend auth UI SHALL be responsive and follow atomic design composition
The first frontend phase SHALL provide mobile, tablet, and desktop responsive auth UI and SHALL organize reusable UI building blocks using atomic design layers.

#### Scenario: Auth UI renders on smaller screens
- **WHEN** a user opens the login or password-change UI on a mobile or tablet viewport
- **THEN** the frontend renders a responsive layout that remains usable without horizontal overflow

#### Scenario: Auth UI reuses atomic layers
- **WHEN** frontend auth pages are implemented
- **THEN** the UI is composed from reusable atomic layers rather than page-local one-off controls
