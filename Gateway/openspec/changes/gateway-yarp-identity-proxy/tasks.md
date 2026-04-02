## 1. Workspace Bootstrap

- [x] 1.1 Copy Gateway root workflow assets (`AGENTS.md`, `.codex`) and initialize `openspec` and `.beads`
- [x] 1.2 Create a Beads issue and OpenSpec change for the initial Gateway proxy slice

## 2. Gateway Proxy Implementation

- [x] 2.1 Add YARP to `OpenSaur.Gateway`
- [x] 2.2 Configure the reverse proxy from appsettings with a `/identity/{**catch-all}` route and Identity cluster
- [x] 2.3 Add development and production upstream configuration values
- [x] 2.4 Align Identity to serve under `/identity` so prefixed proxying works for SPA, assets, API, and OIDC paths

## 3. Verification

- [x] 3.1 Build Gateway and Identity and run focused runtime checks against prefixed proxied routes
- [x] 3.2 Validate the OpenSpec change status after implementation
