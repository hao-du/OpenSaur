## MODIFIED Requirements

### Requirement: Custom auth APIs SHALL authenticate users for the shared identity server

The system SHALL provide JSON-based authentication endpoints inside `OpenSaur.Identity.Web` that validate ASP.NET Core Identity credentials and apply account/workspace eligibility checks before issuing the shared identity-server session cookie. The actual login page UI SHALL be implemented in the FE phase and can post credentials to the backend API on the same host. When Google reCAPTCHA v3 is configured for the hosted login form, the login API SHALL verify the submitted reCAPTCHA token before checking credentials and issuing the shared identity cookie.

#### Scenario: Successful API login
- **WHEN** a valid user submits JSON login credentials with the correct password and the user account and workspace are active
- **THEN** the system authenticates the user, establishes the identity server login session, and returns a successful API response without redirecting the browser

#### Scenario: Invalid credentials
- **WHEN** a user submits incorrect credentials to the login API
- **THEN** the system rejects the login attempt and does not issue any session or token artifacts

#### Scenario: Inactive account or workspace
- **WHEN** a user with `IsActive = false` or a workspace with `IsActive = false` attempts to authenticate
- **THEN** the system rejects the login attempt and does not issue any session or token artifacts

#### Scenario: Hosted login requires successful reCAPTCHA verification when configured
- **WHEN** Google reCAPTCHA v3 is enabled for the issuer-hosted login flow and the submitted login request is missing a valid reCAPTCHA token
- **THEN** the system rejects the login attempt before password validation
- **AND** no session cookie is issued

#### Scenario: API logout clears the shared identity session
- **WHEN** an authenticated user completes the logout API call
- **THEN** the system clears the identity server session cookie and future authorization requests require a new login unless another policy-issued session exists

#### Scenario: Anonymous API logout is rejected
- **WHEN** a caller without a valid authenticated API session invokes the logout API
- **THEN** the system rejects the request instead of clearing the hosted session
