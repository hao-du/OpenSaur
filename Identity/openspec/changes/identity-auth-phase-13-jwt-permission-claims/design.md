# Design

## Overview

The Identity issuer already resolves effective permissions from the database through `PermissionAuthorizationService`. This change reuses that service at token/session-principal issuance time and stamps the resulting canonical permission codes into the authenticated principal as repeated `permissions` claims.

The same claim set must be applied in both places where the system materializes an application principal:

1. OIDC authorization flow for external/non-issuer clients
2. Issuer-hosted cookie session enrichment for `/api/auth/*`

This keeps hosted and non-hosted authorization context aligned.

## Claim Shape

- Claim type: `permissions`
- Value shape: canonical permission code string from the `Permissions.Code` column, for example `Administrator.CanManage`

Design choices:

- Use canonical string codes, not integer `CodeId` values, so downstream clients are not coupled to internal numeric ids.
- Emit repeated claims instead of a single serialized JSON claim so standard claim parsing remains simple.

## Destinations

Permission claims are emitted to the access token only.

Why:

- Permissions are primarily an API and downstream-app authorization concern.
- Avoid unnecessary identity-token growth.
- Keep the ID token focused on profile/session identity data.

The current rule is:

- emit `permissions` only when the principal has the `api` scope

## Effective Permission Resolution

Permission resolution remains DB-backed and workspace-aware:

- super administrators receive the full active permission set
- other users receive the expanded effective permission set for the current workspace
- impersonation continues to use the effective impersonated workspace context

The existing `PermissionAuthorizationService` remains the source of truth.

## Downstream Client Guidance

Downstream clients should:

- trust permission claims from the issuer access token
- avoid direct reads from the Identity DB for routine authorization
- continue to treat the issuer as the only source of truth for effective user permissions
