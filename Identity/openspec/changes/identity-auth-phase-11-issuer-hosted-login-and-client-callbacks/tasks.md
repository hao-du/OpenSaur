## 1. Specification And Approval

- [x] 1.1 Draft the proposal, design, tasks, and delta specs for issuer-hosted login with client-owned OIDC callback URIs
- [x] 1.2 Review and approve the change before implementation

## 2. Browser Client Registration

- [x] 2.1 Replace the singular `Oidc:FirstPartyWeb` callback assumption with an explicit browser-client registration model
- [x] 2.2 Support exact registered redirect URI matching for each browser client and reject unregistered callback URIs
- [x] 2.3 Add post-logout redirect registration support if it is kept in scope for this slice

## 3. Hosted Identity Auth Flow

- [x] 3.1 Refactor hosted auth-start logic to use the configured issuer authority and the registered callback URI for the hosted Identity client
- [x] 3.2 Remove the dependency on current-origin-derived callback construction for hosted browser authorization requests
- [ ] 3.3 Preserve return-url, callback completion, refresh-cookie custody, and logout behavior for the hosted Identity admin shell under the new issuer/client contract

## 4. Verification

- [x] 4.1 Add or update tests for exact redirect-uri handling and rejection of unregistered redirect URIs
- [ ] 4.2 Add or update tests for hosted-session reuse across at least two registered browser clients
- [ ] 4.3 Update implementation guidance or docs for downstream browser clients that integrate with the shared issuer
