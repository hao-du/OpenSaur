# Gateway Rate Limiting and Circuit Breaker

## Overview

Gateway currently applies both protections globally for all incoming requests:

- `Rate Limiting` rejects excess traffic with `429 Too Many Requests`.
- `Circuit Breaker` rejects traffic with `503 Service Unavailable` when upstream failures are continuous.

Implementation entry points:

- `src/OpenSaur.Gateway/Program.cs`
- `src/OpenSaur.Gateway/Infrastucture/GatewayCircuitBreaker.cs`
- `src/OpenSaur.Gateway/ConfigurationOptions/GatewayRateLimitingOptions.cs`
- `src/OpenSaur.Gateway/ConfigurationOptions/GatewayCircuitBreakerOptions.cs`

## Rate Limiting

Rate limiting is configured in `Program.cs` via `AddRateLimiter` and enabled globally via `UseRateLimiter`.

Behavior:

- Partition key: client remote IP (`HttpContext.Connection.RemoteIpAddress`)
- Algorithm: fixed window
- Rejection status: `429`
- Queue order: oldest first

Configuration section:

```json
"Gateway": {
  "RateLimiting": {
    "PermitLimit": 100,
    "QueueLimit": 0,
    "WindowSeconds": 10
  }
}
```

Settings:

- `PermitLimit`: maximum allowed requests per IP during one window.
- `QueueLimit`: number of additional queued requests after permit capacity is reached.
- `WindowSeconds`: window duration in seconds for each fixed counting bucket.

What `Window` means (fixed-window limiter):

- A window is a fixed time bucket where request count is tracked (for example, 10 seconds).
- At the start of each new window, the counter resets to `0`.
- Example with `PermitLimit = 100` and `WindowSeconds = 10`:
  - From `12:00:00` to `12:00:09.999`: up to 100 requests are allowed per client IP.
  - Starting at `12:00:10.000`: a new window starts, and up to 100 requests are allowed again.

## Circuit Breaker

Circuit breaker is implemented in `GatewayCircuitBreaker` and applied as middleware before forwarding.

Behavior:

- Counts consecutive `5xx` responses.
- Opens circuit when failures reach `FailureThreshold`.
- While open, requests are rejected immediately with:
  - status `503`
  - `Retry-After` header (seconds)
- After break duration, circuit closes automatically and requests are allowed again.
- Any non-`5xx` response resets failure counter.

Configuration section:

```json
"Gateway": {
  "CircuitBreaker": {
    "FailureThreshold": 5,
    "BreakDurationSeconds": 30
  }
}
```

Settings:

- `FailureThreshold`: number of consecutive `5xx` responses before opening.
- `BreakDurationSeconds`: how long the circuit remains open.

## Response Codes Priority

For a single request, expected outcomes are:

1. `429` when rate limit is exceeded.
2. `503` when circuit is open.
3. `502` when direct forwarding fails and no response has started.

## Logging

Current logs include:

- request-level gateway logs
- warning when circuit is open and request is rejected
- error when direct forwarding fails

## Tuning Guidance

- Increase `PermitLimit` or `WindowSeconds` if legitimate traffic is throttled too aggressively.
- Increase `FailureThreshold` if occasional upstream blips should not open the circuit.
- Increase `BreakDurationSeconds` if upstream services need longer recovery time.
- Use environment-specific values in `appsettings.Production.json` for production traffic patterns.
