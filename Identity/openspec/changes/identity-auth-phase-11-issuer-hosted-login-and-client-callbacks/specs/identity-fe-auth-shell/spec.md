## MODIFIED Requirements

### Requirement: First-party frontend SHALL receive JWT access tokens through a backend-assisted web-session exchange

The first-party frontend SHALL start authorization against the configured issuer, SHALL use the exact redirect URI registered for the hosted Identity client, and SHALL NOT derive `redirect_uri` from `window.location.origin`. After the registered callback route receives a valid authorization `code`, the frontend SHALL continue to send that `code` to the backend web-session exchange endpoint and SHALL receive a JWT access token for authenticated API access without receiving the refresh token in browser JavaScript.

#### Scenario: Hosted auth shell starts authorization with configured issuer and registered callback

- **WHEN** the hosted first-party auth shell starts a browser authorization request
- **THEN** the authorize URL targets the configured issuer
- **AND** the request uses the hosted client's registered redirect URI instead of deriving it from the current browser origin

#### Scenario: Registered callback completes backend-assisted exchange successfully

- **WHEN** the frontend receives a valid first-party authorization callback on the registered callback route
- **THEN** the frontend posts the authorization `code` to the backend web-session exchange endpoint
- **AND** the backend returns a JWT access token payload to the frontend
- **AND** the backend stores the refresh token in a secure `httpOnly` cookie instead of returning it to browser JavaScript
