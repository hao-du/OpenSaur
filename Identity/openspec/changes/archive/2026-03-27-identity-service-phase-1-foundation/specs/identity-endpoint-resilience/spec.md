## ADDED Requirements

### Requirement: All endpoints SHALL participate in rate limiting
The system SHALL apply a default rate-limit policy to every HTTP endpoint exposed by the identity service, and SHALL allow stricter policies to be attached to sensitive authentication and token routes.

#### Scenario: Default endpoint rate limit applies
- **WHEN** a caller sends requests to an endpoint that does not have a stricter named policy
- **THEN** the system evaluates the request against the default rate-limit policy for that caller

#### Scenario: Sensitive auth route uses stricter policy
- **WHEN** a caller sends requests to a sensitive authentication or token endpoint
- **THEN** the system applies the stricter route-specific rate-limit policy instead of only the default policy

#### Scenario: Rate limit is exceeded
- **WHEN** a caller exceeds the allowed request volume for an endpoint policy window
- **THEN** the system rejects the request with a rate-limit response instead of executing the endpoint handler

### Requirement: Rate-limit partitions SHALL distinguish authenticated and anonymous callers
The system SHALL partition rate limiting by authenticated user identity when available and SHALL fall back to client network identity when the caller is anonymous.

#### Scenario: Authenticated caller is rate limited by user identity
- **WHEN** an authenticated caller invokes a protected endpoint
- **THEN** the system keys the rate-limit partition by that caller's authenticated identity

#### Scenario: Anonymous caller is rate limited by client identity
- **WHEN** an anonymous caller invokes an anonymous endpoint
- **THEN** the system keys the rate-limit partition by the caller's client identity fallback

### Requirement: Selected mutating application endpoints SHALL support idempotent retries
The system SHALL support idempotent retries for selected mutating application endpoints by accepting an idempotency key, using endpoint metadata to opt the route into idempotency handling, storing the first completed result for that key and request shape in cache-backed replay storage, and replaying the stored result for safe duplicates.

For Phase 1, the selected endpoints are the user-management write actions:

- `/api/user/create`
- `/api/user/edit`
- `/api/user/changepassword`
- `/api/user/change-workspace`

#### Scenario: Idempotent write is missing the required key
- **WHEN** a caller invokes a selected mutating application endpoint without an `Idempotency-Key`
- **THEN** the system rejects the request instead of executing the endpoint as a non-idempotent write

#### Scenario: First idempotent write succeeds
- **WHEN** a caller sends a supported mutating application request with a new idempotency key
- **THEN** the system executes the endpoint, stores the completed response for that key and request fingerprint in cache-backed replay storage, and returns the normal response

#### Scenario: Duplicate idempotent write is replayed
- **WHEN** a caller retries the same supported mutating application request with the same idempotency key and matching request fingerprint
- **THEN** the system replays the stored response instead of executing the endpoint again

#### Scenario: Idempotency key is reused with a different payload
- **WHEN** a caller reuses an existing idempotency key with a different request fingerprint
- **THEN** the system rejects the request instead of replaying or re-executing it as though it were the original call

### Requirement: OIDC protocol endpoints SHALL not use generic application idempotency handling
The system SHALL not apply the generic application idempotency contract to OIDC protocol endpoints whose protocol semantics already define one-time token and authorization-code behavior.

#### Scenario: OIDC token endpoint bypasses application idempotency
- **WHEN** a client calls an OIDC protocol endpoint such as `/connect/token`
- **THEN** the system uses the protocol-defined behavior for token redemption and refresh handling instead of the generic idempotency replay mechanism

### Requirement: Endpoint resilience policy selection SHALL be endpoint-metadata driven
The system SHALL allow application endpoints to opt into resilience policy scopes and idempotency behavior using endpoint metadata instead of relying on a hardcoded application route list.

#### Scenario: Application endpoint opts into a stricter resilience scope
- **WHEN** an application endpoint is annotated with a stricter resilience scope
- **THEN** the system applies that scope when evaluating rate limiting behavior

#### Scenario: Application endpoint opts into idempotency
- **WHEN** an application endpoint is annotated for idempotency handling
- **THEN** the system requires `Idempotency-Key` and evaluates replay behavior for that endpoint even if its URL is not part of a hardcoded route list
