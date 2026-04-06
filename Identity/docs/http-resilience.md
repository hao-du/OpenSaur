# HTTP Resilience In OpenSaur Identity

This document describes the current inbound HTTP resilience model in `OpenSaur.Identity.Web`.

The important rule is:

- rate limiting is active for all requests
- idempotency is active only for selected `POST` and `PUT` endpoints that opt in
- there is no inbound circuit breaker in the app today

So when reading the current codebase:

- rate limiting: yes
- idempotency: yes
- inbound circuit breaker: no

## Main Code Paths

Pipeline and policy resolution:

- `src/OpenSaur.Identity.Web/Program.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/DependencyInjection.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Metadata/EndpointResilienceContextResolver.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Metadata/EndpointResilienceEndpointExtensions.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/RateLimiting/EndpointResiliencePolicyResolver.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/RateLimiting/EndpointRateLimitingOptions.cs`

Idempotency implementation:

- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/IdempotencyMiddleware.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/IdempotencyRequest.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/IdempotencyCacheEntry.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/IdempotencyCacheStore.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/IdempotencyRequestLockProvider.cs`

Example endpoint wiring:

- `src/OpenSaur.Identity.Web/Features/Auth/AuthEndpoints.cs`
- `src/OpenSaur.Identity.Web/Features/Auth/Oidc/OidcEndpoints.cs`
- `src/OpenSaur.Identity.Web/Features/Roles/RoleEndpoints.cs`
- `src/OpenSaur.Identity.Web/Features/UserRoles/UserRoleEndpoints.cs`
- `src/OpenSaur.Identity.Web/Features/OidcClients/OidcClientEndpoints.cs`
- `src/OpenSaur.Identity.Web/client/src/features/oidc-clients/api/oidcClientsApi.ts`

## Request Pipeline Order

Code locations:

- `Program.cs`
- `DependencyInjection.cs`

What happens:

1. Endpoints are mapped with optional resilience metadata such as `.WithResilienceScope(...)` and `.RequireIdempotency()`.
2. `Program.cs` runs `app.UseRateLimiter();`.
3. `Program.cs` then runs `app.UseMiddleware<IdempotencyMiddleware>();`.
4. That means rate limiting decides first whether a request is allowed to proceed at all.
5. Idempotency runs only after a request passes rate limiting and only when the endpoint explicitly opted in.

## Rate Limiting

Rate limiting protects the app from request floods, login abuse, and accidental request storms.

### How policy scope is chosen

Code locations:

- `EndpointResilienceEndpointExtensions.cs`
- `EndpointResilienceContextResolver.cs`
- `EndpointResiliencePolicyResolver.cs`

What happens:

1. Endpoints can assign a named scope with `.WithResilienceScope(...)`.
2. `EndpointResilienceContextResolver` resolves the current request into one of these scopes:
   - `Default`
   - `Auth`
   - `Token`
3. If the endpoint did not assign metadata, the resolver falls back to:
   - `Token` for `/connect/token`
   - `Default` for everything else
4. `EndpointResiliencePolicyResolver` maps that scope to thresholds from `EndpointResilienceOptions.RateLimiting`.

Current examples:

- `AuthEndpoints.cs` marks login, logout, change-password, impersonation, and web-session endpoints as `Auth`
- `OidcEndpoints.cs` marks `/connect/authorize` as `Token`
- `/connect/token` is also treated as `Token` through the path-based fallback in `EndpointResilienceContextResolver`

### How callers are partitioned

Code locations:

- `EndpointResilienceContextResolver.cs`
- `DependencyInjection.cs`

What happens:

1. Authenticated callers are partitioned by user identity:
   - `user:<sub>`
   - or `user:<nameidentifier>` when `sub` is missing
2. Anonymous callers fall back to client IP:
   - `ip:<remote-ip>`
3. `DependencyInjection.AddRateLimiter(...)` combines that caller key with the policy scope:
   - `${policyScope}:${callerScopeKey}`
4. Each partition gets its own fixed-window limiter instance.

This means one caller does not consume another caller's quota.

### What happens when the limit is exceeded

Code locations:

- `DependencyInjection.cs`
- `Program.cs`

What happens:

1. ASP.NET Core rejects the request with `429 Too Many Requests`.
2. The endpoint handler does not run.
3. `IdempotencyMiddleware` also does not get a chance to execute for that rejected request.

## Idempotency

Idempotency protects selected write endpoints from duplicate execution when clients retry the same request.

### How endpoints opt in

Code locations:

- `EndpointResilienceEndpointExtensions.cs`
- `RoleEndpoints.cs`
- `UserRoleEndpoints.cs`
- `OidcClientEndpoints.cs`

What happens:

1. The app does not apply idempotency to every route.
2. Selected write endpoints opt in with `.RequireIdempotency()`.
3. `EndpointResilienceContextResolver` only treats `POST` and `PUT` requests as eligible for idempotency, even if another verb somehow has metadata.

Current examples:

- `POST /api/role/create`
- `PUT /api/role/edit`
- `POST /api/user-role/create`
- `PUT /api/user-role/edit`
- `POST /api/oidc-client/create`
- `PUT /api/oidc-client/edit`

The frontend sends the matching request intent from places such as `oidcClientsApi.ts`, where `create` and `edit` calls use the HTTP client's `idempotent: true` option.

### How the middleware builds a replay key

Code locations:

- `IdempotencyMiddleware.cs`
- `IdempotencyRequest.cs`

What happens:

1. `IdempotencyMiddleware` resolves the endpoint's resilience context.
2. If the endpoint does not require idempotency, the request passes straight through.
3. If the endpoint requires idempotency, the middleware requires the `Idempotency-Key` header.
4. `IdempotencyRequest.TryCreateAsync(...)` builds:
   - a cache key: `idempotency:{callerScope}:{endpointKey}:{clientKey}`
   - a fingerprint hash from method, path, content type, caller scope, and request body
5. That fingerprint lets the app distinguish a legitimate retry from an accidental key reuse with a different payload.

### How duplicate execution is prevented

Code locations:

- `IdempotencyRequestLockProvider.cs`
- `IdempotencyCacheStore.cs`
- `IdempotencyMiddleware.cs`

What happens:

1. The middleware acquires an in-process lock for the computed cache key.
2. It checks `IdempotencyCacheStore` for an existing cached response.
3. If a cached response exists with the same fingerprint, the middleware replays it.
4. If the same key is reused with a different fingerprint, the middleware returns a conflict response.
5. If no cached response exists, the endpoint executes normally and the middleware captures the response.

Important limitation:

- the lock is only in-process
- it is not a distributed lock across multiple app instances

### What gets replayed

Code locations:

- `IdempotencyMiddleware.cs`
- `IdempotencyCacheEntry.cs`

What happens:

1. The middleware buffers the real HTTP response.
2. After the endpoint finishes, it writes the same bytes back to the live response stream.
3. It stores a replayable response entry containing:
   - status code
   - content type
   - replay-safe headers
   - response body
4. On a duplicate request, the middleware rebuilds that original response shape without re-running the endpoint.

This is full-response replay, not just business-object replay.

### Which responses are persisted

Code locations:

- `IdempotencyMiddleware.cs`

What happens:

1. Replay entries are stored only for replay-safe responses.
2. The middleware does not persist:
   - `5xx` responses
   - `429 Too Many Requests`
3. That avoids replaying transient server failures or rate-limit rejections as if they were successful completed writes.

## What Is Not Implemented

There is no inbound circuit breaker middleware or state store in the app today.

The current direction is:

- gateway or edge controls for inbound abuse protection
- app-side rate limiting for request throttling
- idempotency for duplicate write protection
- outbound circuit breakers later if the app grows more downstream dependency calls

## Operational Consequences

When adding or reviewing an endpoint:

- choose the right resilience scope so auth and token routes can be throttled more tightly than general API routes
- add `.RequireIdempotency()` only when the write should safely replay on retry
- make sure clients send `Idempotency-Key` when they call an idempotent write endpoint
- remember that the current idempotency behavior is cache-backed and instance-local, not a fully distributed exactly-once guarantee

## Current Design Record

- `openspec/changes/identity-service-phase-1-foundation/specs/identity-endpoint-resilience/spec.md`
