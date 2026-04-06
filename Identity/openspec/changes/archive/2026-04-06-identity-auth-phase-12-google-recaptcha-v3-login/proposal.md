# Proposal

## Summary

Add optional Google reCAPTCHA v3 protection to the issuer-hosted login form for `OpenSaur.Identity.Web`.

## Why

- The issuer-hosted login form is the browser entry point for password authentication.
- Current rate limiting reduces brute-force traffic but does not add a bot-verification step.
- Downstream browser and backend clients already trust the shared issuer, so protecting the hosted login page strengthens the common trust boundary.

## Scope

- Add config-driven Google reCAPTCHA v3 support for the hosted login form only.
- Expose the public site key and login action to the frontend through the existing runtime config endpoint.
- Verify the reCAPTCHA token on the backend before checking credentials.
- Keep the feature disabled by default until real keys are configured.

## Out Of Scope

- CAPTCHA on non-login endpoints
- CAPTCHA on OIDC protocol endpoints
- Alternative CAPTCHA providers
