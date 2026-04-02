## ADDED Requirements

### Requirement: Gateway SHALL expose Identity only under `/identity`
The system SHALL expose `OpenSaur.Gateway` as an ASP.NET Core 10 YARP reverse proxy that forwards requests under `/identity/{**catch-all}` to a configured Identity upstream destination, without exposing Identity routes at Gateway root.

#### Scenario: Prefixed route forwards a request path
- **WHEN** a client sends a request to `/identity/{**catch-all}` on Gateway
- **THEN** Gateway forwards the request to the configured Identity upstream using the same prefixed path and query string

#### Scenario: Identity response is returned by Gateway
- **WHEN** the configured Identity upstream returns a successful response
- **THEN** Gateway returns that upstream response to the client

#### Scenario: Root route does not expose Identity
- **WHEN** a client sends a request to a non-prefixed Identity path such as `/login`
- **THEN** Gateway SHALL NOT expose the Identity application on that root path

### Requirement: Identity SHALL be path-base aware under `/identity`
The system SHALL serve Identity itself under `/identity` so the generated browser routes, static asset URLs, API calls, and OIDC endpoints all remain within that prefix.

#### Scenario: SPA shell emits prefixed asset paths
- **WHEN** the Identity login shell is requested under `/identity/login`
- **THEN** the returned HTML SHALL reference built assets under `/identity/assets/...`

#### Scenario: Identity root paths are not served without the prefix
- **WHEN** a client requests a root path such as `/login` directly from the Identity service
- **THEN** Identity SHALL return `404 Not Found`

### Requirement: Gateway SHALL use environment-specific Identity upstream configuration
The system SHALL load the Identity upstream destination from ASP.NET Core configuration, with a concrete development value and a production placeholder value that can be replaced later.

#### Scenario: Development environment targets local Identity
- **WHEN** Gateway runs with the Development environment
- **THEN** the configured upstream destination SHALL be `http://localhost:5220/`

#### Scenario: Production environment requires explicit upstream configuration
- **WHEN** Gateway runs with the Production environment defaults from source control
- **THEN** the configured upstream destination SHALL remain a placeholder value that operators can replace later
