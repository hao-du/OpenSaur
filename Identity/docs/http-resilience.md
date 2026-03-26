# HTTP Resilience In OpenSaur Identity

This document explains the HTTP resilience mechanisms used in this repository:

- rate limiting
- idempotency
- inbound circuit breaker

It also explains the **current status** of each mechanism in this codebase, because not all three are active today.

## Current Status In This Repository

### Implemented now

- **Rate limiting**
  - implemented
  - active in the ASP.NET Core pipeline

- **Idempotency**
  - implemented
  - active in the ASP.NET Core pipeline for selected write endpoints

### Not currently active

- **Inbound circuit breaker**
  - **not currently implemented**
  - it was explored earlier in the design phase, but intentionally removed from the application
  - the current direction is to rely on:
    - API gateway / edge protections for inbound abuse controls
    - app-side rate limiting
    - outbound circuit breakers later if the service gains downstream dependencies that need that protection

So when reading the code today:

- rate limiting: yes
- idempotency: yes
- inbound circuit breaker: no

## Why These Mechanisms Exist

These three mechanisms solve different problems.

### Rate limiting

Protects the service from too many requests in a given time window.

Example:
- client sends 500 login attempts in a minute
- the service rejects excess requests with `429 Too Many Requests`

### Idempotency

Protects selected write endpoints from duplicate execution when the client retries the same request.

Example:
- user clicks `Create User` multiple times
- client retries because of a timeout
- the service should not create multiple users for the same intended request

### Inbound circuit breaker

Would protect the app from repeatedly executing an endpoint that is already failing badly.

Example:
- a route is throwing repeated `5xx` failures
- the breaker could temporarily stop trying that route and return fast failures

In this project, we decided **not** to keep the inbound circuit breaker in the app because:

- gateway or edge layers are better for inbound traffic protection
- app-side rate limiting already gives useful defense-in-depth
- if a dependency fails, outbound circuit breakers are usually a better tool

## Rate Limiting

## What It Does

Rate limiting controls how many requests a caller can make during a configured time window.

In this project:

- every endpoint participates in rate limiting
- some endpoints use stricter limits than others
- rate limiting is partitioned by caller identity

## Where It Is Implemented

Main files:

- `src/OpenSaur.Identity.Web/Infrastructure/DependencyInjection.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/RateLimiting/EndpointRateLimitingOptions.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/RateLimiting/EndpointResiliencePolicyResolver.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/RateLimiting/EndpointResiliencePolicyScope.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Metadata/EndpointResilienceContextResolver.cs`
- `src/OpenSaur.Identity.Web/Program.cs`

## How It Works

### 1. ASP.NET Core rate limiter is registered

In `DependencyInjection.cs`:

- `services.AddRateLimiter(...)`

This creates a global rate limiter for all requests.

### 2. The rate limiter runs in the request pipeline

In `Program.cs`:

- `app.UseRateLimiter();`

So requests are evaluated before endpoint handlers run.

### 3. The app decides which policy scope applies

The current scopes are:

- `Default`
- `Auth`
- `Token`

These are resolved using:

- `EndpointResilienceContextResolver`
- `EndpointResiliencePolicyResolver`

### 4. Different endpoints can use different limits

Examples:

- normal API endpoints use `Default`
- auth endpoints such as login/logout/change-password use `Auth`
- OIDC token-style routes use `Token`

This is attached using endpoint metadata such as:

- `.WithResilienceScope(...)`

### 5. The rate limit is partitioned by caller

The current design uses:

- authenticated user identity when available
- fallback caller identity when anonymous

That means rate limiting is not one single global bucket for everyone.

## What Happens When The Limit Is Exceeded

ASP.NET Core rejects the request with:

- `429 Too Many Requests`

and the endpoint handler does not run.

## Why This Helps

Rate limiting is useful for:

- login abuse reduction
- accidental request storms
- protecting write endpoints
- defense-in-depth even if a gateway already exists

## Idempotency

## What It Does

Idempotency lets selected write endpoints safely handle retries.

The idea is:

- client sends a request with an `Idempotency-Key`
- the service remembers the completed result for that exact request
- if the same request is retried with the same key and same payload, the service replays the original result instead of executing the endpoint again

## Where It Is Implemented

Main files:

- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/IdempotencyMiddleware.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/IdempotencyRequest.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/IdempotencyCacheEntry.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/IdempotencyCacheStore.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/IdempotencyRequestLockProvider.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/EndpointIdempotencyOptions.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Metadata/EndpointResilienceEndpointExtensions.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Metadata/EndpointResilienceContextResolver.cs`
- `src/OpenSaur.Identity.Web/Program.cs`

## How It Works

### 1. Selected endpoints opt in with metadata

The app does **not** apply idempotency to every route.

Selected mutating routes opt in using:

- `.RequireIdempotency()`

Examples today include write endpoints in:

- users
- roles
- user roles
- workspaces

### 2. Middleware checks whether the current request requires idempotency

In `Program.cs`:

- `app.UseMiddleware<IdempotencyMiddleware>();`

The middleware uses endpoint metadata to decide whether the current endpoint participates.

### 3. Only write requests are considered

Idempotency is only meaningful for mutating requests.

That means:

- it is intended for writes
- it is not used as a generic caching layer for all `GET` requests

### 4. The request must include `Idempotency-Key`

If a selected endpoint is called without the required header:

- the request is rejected

The configured header name lives in:

- `EndpointIdempotencyOptions`

and is currently:

- `Idempotency-Key`

### 5. The request is fingerprinted

The middleware creates an `IdempotencyRequest` that includes enough information to tell:

- whether this is the same request as before
- whether the same key is being reused with a different payload

### 6. The middleware checks replay storage

The current implementation stores idempotency entries using:

- `HybridCache`

through:

- `IdempotencyCacheStore`

This means the replay result is cache-backed, not stored in a dedicated database table.

### 7. An in-process lock prevents duplicate concurrent execution

This is handled by:

- `IdempotencyRequestLockProvider`

It uses an in-process lock so that, inside one running app instance:

- two identical in-flight requests do not both execute before the first one stores the result

Important limitation:

- this protects only within one process
- it is not a distributed lock across multiple app instances

### 8. The first completed response is captured and replayed

The middleware stores the first completed response as an `IdempotencyCacheEntry`.

That entry contains more than just the business object. It stores the completed HTTP response shape, including:

- status code
- content type
- selected headers
- response body

This is called **full-response replay**.

It means a duplicate request gets back the same HTTP response result instead of re-running the endpoint.

## Important Idempotency Behaviors

### Missing key

If a participating endpoint is called without `Idempotency-Key`:

- request is rejected

### First request with a new key

- endpoint executes normally
- response is captured and stored

### Same key with same request payload

- stored response is replayed
- endpoint is not executed again

### Same key with different payload

- request is rejected as a key reuse conflict

This prevents one idempotency key from being reused for unrelated writes.

## Why This Helps

Idempotency is useful for:

- repeated button clicks
- browser retries
- client retries after network timeouts
- preventing accidental duplicate writes

## Why We Did Not Keep A Database Table For This

Earlier in the design process, we explored DB-backed idempotency storage.

The current implementation intentionally uses:

- `HybridCache`

instead, because:

- it is reusable for other caching needs
- it avoids adding a dedicated idempotency table
- it keeps the first-phase implementation lighter

Current tradeoff:

- good for current same-app behavior
- stronger distributed guarantees would need further work later, especially in multi-instance deployments

## Inbound Circuit Breaker

## What It Is

An inbound circuit breaker is an application-side mechanism that stops calling a failing endpoint temporarily after repeated failures.

Typical behavior would be:

- endpoint keeps failing with `5xx`
- breaker opens
- app stops executing that endpoint for a short time
- app returns fast failures such as `503`

## Was It Implemented?

Not anymore.

This repository previously explored an app-side inbound circuit breaker, but it was intentionally removed.

So today:

- there is no active inbound circuit breaker middleware in the app
- there is no circuit breaker state store in the current `Infrastructure/Http` folder

## Why It Was Removed

We decided the app should not rely on an inbound circuit breaker as the main protection for request floods or broken paths.

The reasoning was:

- **API gateway / edge protection** is a better place for inbound abuse control
- **rate limiting** already gives meaningful app-side protection
- **outbound circuit breakers** are usually more useful when a downstream dependency is failing

That means the current strategy is:

- inbound abuse control: gateway plus app-side rate limiting
- duplicate write protection: idempotency
- downstream dependency resilience: add outbound circuit breakers later if needed

## If We Revisit It Later

If the project later needs an app-side inbound circuit breaker, it should be treated as a separate decision with clear scope:

- which routes participate
- what failure types count
- what response should be returned
- whether state is per-instance or distributed

But that is not the current implementation.

## Summary

### Implemented now

- **Rate limiting**
  - active for all endpoints
  - stricter scopes for auth and token-related routes

- **Idempotency**
  - active for selected mutating endpoints
  - uses endpoint metadata
  - uses `HybridCache`
  - uses in-process request locking
  - replays stored HTTP responses for safe duplicates

### Not active now

- **Inbound circuit breaker**
  - not currently implemented
  - intentionally removed from the app design

## Code References

### Rate limiting

- `src/OpenSaur.Identity.Web/Infrastructure/DependencyInjection.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/RateLimiting/EndpointRateLimitingOptions.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/RateLimiting/EndpointResiliencePolicyResolver.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/RateLimiting/EndpointResiliencePolicyScope.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Metadata/EndpointResilienceContextResolver.cs`
- `src/OpenSaur.Identity.Web/Program.cs`

### Idempotency

- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/IdempotencyMiddleware.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/IdempotencyRequest.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/IdempotencyCacheEntry.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/IdempotencyCacheStore.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Idempotency/IdempotencyRequestLockProvider.cs`
- `src/OpenSaur.Identity.Web/Infrastructure/Http/Metadata/EndpointResilienceEndpointExtensions.cs`
- `src/OpenSaur.Identity.Web/Program.cs`

### Current design record

- `openspec/changes/identity-service-phase-1-foundation/specs/identity-endpoint-resilience/spec.md`
