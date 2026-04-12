# Identity Browser Login Step By Step

This topic is now split into three scenario-specific documents because the control flow is different depending on whether:

- the shell and issuer are on different hosts
- the shell and issuer are the same host
- the client is Umbraco instead of the Identity SPA

## Choose The Scenario

1. Identity SPA on `localhost:5220/identity` using issuer `https://app.duchihao.com/identity`
   - file:
     - `D:\OpenSaur\Identity\docs\identity-browser-login-step-by-step-external-issuer.md`

2. Identity SPA on `https://app.duchihao.com/identity` where the app is also the issuer host
   - file:
     - `D:\OpenSaur\Identity\docs\identity-browser-login-step-by-step-issuer-hosted.md`

3. Umbraco on `https://localhost:5321/umbraco` using `https://app.duchihao.com/identity` as the custom login page
   - file:
     - `D:\OpenSaur\Identity\docs\identity-browser-login-step-by-step-umbraco-backoffice.md`

## Why The Split Matters

These three flows look similar at a high level, but the critical branch is different:

- different host:
  - the shell behaves like an external OIDC client and redirects out to the issuer immediately
- same host:
  - the shell uses the local login form first, then resumes `/connect/authorize`
- Umbraco:
  - Umbraco starts its own backoffice external-login flow, then delegates to OpenID Connect middleware

If you are debugging a redirect loop or a wrong callback URL, start with the document that matches the deployment shape exactly.

