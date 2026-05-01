# ACA OIDC Certificates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruct stable OIDC signing and encryption `.pfx` files inside the ACA container from secret values on every deployment and container start.

**Architecture:** The ACA deploy pipeline writes the base64 and password values into ACA secrets, then updates the container app revision with secret-backed environment variables and fixed in-container certificate paths. The image uses a small entrypoint script that decodes the base64 secrets into `/app/certs/*.pfx` before launching the ASP.NET app, allowing the existing OpenIddict file-based loader to keep working unchanged.

**Tech Stack:** Azure DevOps Pipelines, Azure CLI, Azure Container Apps, POSIX shell, .NET 10

---

### Task 1: Add runtime certificate reconstruction

**Files:**
- Create: `devops/container-entrypoint.sh`
- Modify: `devops/Dockerfile.artifact`

- [ ] Add a startup script that validates the certificate base64 environment variables, decodes them into fixed `.pfx` file paths under `/app/certs`, and then starts `OpenSaur.CoreGate.Web.dll`.
- [ ] Update the runtime image to include the startup script, prepare the `/app/certs` directory, and use the script as the container entrypoint while preserving the non-root runtime user.

### Task 2: Include runtime script in the published Docker build context

**Files:**
- Modify: `devops/azure-pipelines.artifact-to-dockerhub.yml`

- [ ] Copy `devops/container-entrypoint.sh` into the publish output alongside `Dockerfile.artifact` so the Docker build context contains the startup script.

### Task 3: Wire ACA secrets and environment variables during deployment

**Files:**
- Modify: `devops/azure-pipelines.dockerhub-to-aca.yml`

- [ ] Add an ACA secret update step using `az containerapp secret set` for four pipeline-provided values: signing cert base64, signing cert password, encryption cert base64, and encryption cert password.
- [ ] Extend `az containerapp update` to set the fixed certificate file path variables for both the startup script and the app configuration, and reference the ACA secrets via `secretref:` for the base64 and password values.

### Task 4: Verify deployment contract

**Files:**
- Create: `docs/superpowers/plans/2026-05-01-aca-oidc-certificates.md`

- [ ] Document the deployment contract: required Azure DevOps secret variable names are `OidcSigningCertificateBase64`, `OidcSigningCertificatePassword`, `OidcEncryptionCertificateBase64`, and `OidcEncryptionCertificatePassword`, and the fixed in-container paths are `/app/certs/oidc-signing.pfx` and `/app/certs/oidc-encryption.pfx`.
