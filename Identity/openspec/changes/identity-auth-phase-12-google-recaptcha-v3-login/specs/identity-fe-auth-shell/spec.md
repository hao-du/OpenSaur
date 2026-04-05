## MODIFIED Requirements

### Requirement: Frontend auth-only phase SHALL expose the minimal route set
The first frontend phase SHALL expose an auth-only route set consisting of `/login`, `/auth/callback`, `/change-password`, and one protected shell route.

#### Scenario: Anonymous user opens the login page
- **WHEN** an anonymous user navigates to `/login`
- **THEN** the system renders the login UI without requiring a prior authenticated session

#### Scenario: Authenticated user opens the protected shell
- **WHEN** a user with a valid first-party session navigates to the protected shell route
- **THEN** the system renders the protected shell instead of redirecting back to login

#### Scenario: Hosted login acquires reCAPTCHA v3 from runtime config when configured
- **WHEN** the first-party shell is running on the issuer-hosted login page and Google reCAPTCHA v3 is configured
- **THEN** the current host serves the public site key and login action through runtime config
- **AND** the hosted login page acquires a reCAPTCHA token before submitting credentials to `/api/auth/login`
