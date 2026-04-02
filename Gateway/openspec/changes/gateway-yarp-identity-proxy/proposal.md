## Why

Gateway needs its own service workspace so it can evolve independently from Identity while still following the same local delivery workflow. The first functional slice for Gateway is a YARP-based reverse proxy in front of Identity so downstream services and clients can start integrating through a single gateway entry point.

## What Changes

- Create a standalone `Gateway` workspace with its own `AGENTS.md`, `.codex`, `openspec`, and `.beads` tooling.
- Turn `OpenSaur.Gateway` into an ASP.NET Core 10 YARP reverse proxy service.
- Configure Gateway to expose Identity only under `/identity/{**catch-all}`.
- Align Identity to run as a path-base-aware application under `/identity` so SPA routes, static assets, API calls, and OIDC endpoints all resolve correctly through Gateway.
- Add environment-specific upstream configuration:
  - Development points to `http://localhost:5220`
  - Production uses a placeholder value to be filled later
- Add build and runtime verification for proxy configuration and end-to-end request forwarding without introducing a dedicated test project in this slice.

## Capabilities

### New Capabilities
- `reverse-proxy-gateway`: Gateway service bootstraps as a standalone workspace and proxies Identity only under `/identity`.

### Modified Capabilities

## Impact

- New sibling service workspace under `Gateway/`
- New ASP.NET Core dependency on `Yarp.ReverseProxy`
- New Gateway environment configuration for upstream Identity base URLs
