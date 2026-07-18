## Context

`Gateway` already has a minimal ASP.NET Core project scaffold under `src/OpenSaur.Gateway`, but it does not yet behave as a service workspace or a reverse proxy. The user wants the same local workflow primitives used in `Identity`: Codex skills, AGENTS rules, OpenSpec, and Beads. Functionally, Gateway needs a minimal first slice only: expose Identity through a dedicated `/identity` prefix, with development targeting the local Identity app on `http://localhost:5220`.

## Goals / Non-Goals

**Goals:**
- Bootstrap `Gateway` as an independent sibling workspace with local Codex, OpenSpec, and Beads tooling.
- Add a YARP reverse proxy to `OpenSaur.Gateway`.
- Configure a dedicated `/identity/{**catch-all}` route that forwards to the configured Identity upstream.
- Ensure Identity itself runs path-base aware under `/identity` so the gateway does not need a root fallback route.
- Provide environment-specific upstream configuration with a real development URL and a production placeholder.
- Verify the proxy behavior through build and runtime checks without introducing a dedicated Gateway test project in this slice.

**Non-Goals:**
- No custom auth, rate limiting, or header transform logic in Gateway yet.
- No service discovery, load balancing, or multi-upstream routing in this slice.
- No Docker, pipeline, or deployment automation for Gateway in this slice.

## Decisions

### 1. Bootstrap Gateway as a separate local workspace
Gateway gets its own `AGENTS.md`, `.codex`, `openspec`, and `.beads` root assets instead of reusing Identity in place.

Why:
- It matches the requested repository operating model.
- It keeps Gateway task/spec history separate from Identity.
- It allows Gateway to evolve with its own issues and changes.

Alternative considered:
- Reusing Identity’s tooling in-place would be faster initially, but it would couple the workflows of two separate services.

### 2. Use YARP configuration-based routing
Gateway will use `AddReverseProxy().LoadFromConfig(...)` with one route and one cluster defined in appsettings.

Why:
- It is the smallest correct YARP setup.
- Environment overrides are naturally handled through ASP.NET Core configuration.
- It avoids premature custom proxy code.

Alternative considered:
- Programmatic route configuration would work, but it is harder to inspect and less convenient for environment-specific upstream changes.

### 3. Use a dedicated `/identity` route for the first slice
The initial proxy route will match `/identity/{**catch-all}` and forward to the Identity cluster without exposing Identity at Gateway root.

Why:
- The user wants Gateway root available for future services and applications.
- Keeping Identity under a dedicated prefix establishes the intended multi-app gateway contract now.
- A dedicated prefix is only correct if Identity itself emits `/identity/...` asset, route, API, and OIDC URLs.

Alternative considered:
- Using a root fallback route in Gateway is simpler short term, but it leaks Identity onto `/` and breaks the intended multi-app routing model.

### 4. Make Identity path-base aware instead of rewriting responses in Gateway
Identity will serve itself under `/identity` so the generated SPA asset paths, browser routes, API requests, and OIDC redirect/issuer URLs are all prefixed consistently.

Why:
- It keeps the public contract explicit and stable.
- It avoids brittle response rewriting in Gateway.
- It allows Gateway to stay a simple path prefix proxy.

Alternative considered:
- Rewriting HTML or adding fallback root proxy routes in Gateway would work as a temporary compatibility layer, but it would keep Identity effectively exposed at `/`.

### 5. Defer the dedicated Gateway test project
The initial Gateway slice will not add a separate test project. Verification will rely on building the service and performing focused runtime checks against the catch-all proxy behavior.

Why:
- It matches the current instruction to defer test-project work.
- It keeps the first slice focused on bootstrapping the service and proxy behavior.

Alternative considered:
- Adding a dedicated test project now would provide stronger automation, but it is explicitly deferred for a later slice.

## Risks / Trade-offs

- [Identity and Gateway must remain aligned on the `/identity` public path] -> Keep the prefix encoded in both service config and runtime verification checks.
- [Production upstream is intentionally incomplete] -> Keep a clear placeholder value in production settings so deployment configuration must set the real value later.

## Migration Plan

1. Bootstrap Gateway workspace assets.
2. Add YARP package and `/identity` proxy configuration.
3. Align Identity app and client assets to run under `/identity`.
4. Build both services and run focused runtime checks against prefixed proxied routes.
5. Operators fill the production upstream URL later through config management.

Rollback:
- Remove the YARP package and revert Gateway to its minimal app if this slice is rolled back.

## Open Questions

- None for this slice. The production Identity base URL is intentionally left as a deployment-time configuration value.
