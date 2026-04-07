## Context

The Identity service supports starting impersonation through an issuer-hosted bridge command. For non-issuer clients such as a localhost first-party client, the bridge completes by rebuilding an OIDC `/connect/authorize` request that points back to the client callback. A current regression causes this resumed authorize path to fail with a `500` instead of returning an authorization code.

## Goals / Non-Goals

**Goals:**
- Identify the failing server-side step in the impersonation resume flow.
- Fix the resume path without changing the intended issuer/client contract.
- Preserve strict redirect URI validation and managed-client ownership rules.

**Non-Goals:**
- Redesign the overall impersonation UX.
- Relax OIDC redirect URI validation.
- Add automated tests in this slice.

## Decisions

### Diagnose the live issuer-side exception before broadening the fix

The failure occurs on the deployed issuer and the screenshot only shows the resulting `500`. The most reliable path is to inspect the live server logs and then apply the smallest code fix at the failing step instead of guessing at several possible auth-path branches.

## Risks / Trade-offs

- [The failure may only occur on the deployed issuer configuration] -> Inspect the live ACA logs and keep the code change localized.
- [Impersonation resume touches security-sensitive OIDC state] -> Preserve exact redirect URI and client resolution rules while fixing the failure.

## Verification

- Run the relevant non-test build verification after the fix.
- Validate the OpenSpec change.
