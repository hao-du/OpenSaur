# Feature 003: Interactive OAuth2 User Consent Screen

**Status**: Completed  
**Target Release**: `release-001`  
**Description**: Implements interactive authorization consent detection in `AuthorizeHandler.cs`, persistent `OpenIddictAuthorization` records, and consent endpoint UI/form.

---

## Task Breakdown & Implementation Checklist

- [x] **Item 1: Consent Detection in `AuthorizeHandler.cs`**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/Handlers/OpenIddict/AuthorizeHandler.cs`
  - Query existing authorizations using `IOpenIddictAuthorizationManager.FindAsync(subject, client_id, status, type)`.
  - Check if granted scopes cover all requested scopes.
  - If consent is missing or `prompt=consent`, store authorization request state in cache/session and redirect to `/consent`.

- [x] **Item 2: Create Consent Endpoint & HTML Form (`ConsentEndpoints.cs`)**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/ConsentEndpoints.cs`
  - Map `GET /consent` rendering a clean HTML form displaying client application name, requested scopes list, and Accept/Reject POST buttons.
  - Map `POST /consent` to process user decision.

- [x] **Item 3: Handle User Consent Acceptance & Authorization Creation**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/Handlers/OpenIddict/ConsentHandler.cs`
  - On Accept: Create/update persistent `OpenIddictAuthorization` record (`Type = Permanent`, `Status = Valid`).
  - Resume OIDC `/connect/authorize` flow and issue authorization code.

- [x] **Item 4: Handle User Consent Rejection**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/Handlers/OpenIddict/ConsentHandler.cs`
  - On Reject: Return standard OIDC `access_denied` error redirect to client's `redirect_uri`.
