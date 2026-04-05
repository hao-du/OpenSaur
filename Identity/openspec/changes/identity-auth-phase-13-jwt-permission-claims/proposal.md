# Proposal

## Summary

Emit effective permission codes as JWT/access-token claims from the Identity issuer.

## Why

- Downstream apps such as Umbraco or future clients should be able to authorize against the token they already receive from the issuer.
- Clients should not need direct database access to the Identity permission model.
- The issuer already computes effective permissions; putting those permissions into the access token makes that trust boundary explicit.

## Scope

- Add a stable `permissions` access-token claim.
- Populate it from the effective DB-backed permission set for the current user and effective workspace/impersonation context.
- Keep it access-token only by default.
- Ensure issuer-hosted cookie-bootstrapped sessions are enriched with the same permission claims.

## Out Of Scope

- Identity-token permission claims
- Frontend UI changes that consume permission claims directly
- Replacing existing backend authorization policy checks
