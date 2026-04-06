# Design

## Overview

reCAPTCHA v3 belongs on the issuer-hosted login boundary:

1. The current host serves runtime config that includes an optional public site key and login action.
2. The hosted login page preloads the Google reCAPTCHA v3 script when enabled.
3. On submit, the page requests a one-time reCAPTCHA token and sends it with the existing `/api/auth/login` JSON payload.
4. The backend verifies that token before checking username/password and issuing the shared identity cookie.

Non-issuer hosts continue to redirect to the issuer-hosted login page and do not need their own CAPTCHA implementation.

## Configuration Model

Add a new optional config section:

```json
"GoogleRecaptchaV3": {
  "Enabled": false,
  "SiteKey": "",
  "SecretKey": "",
  "MinimumScore": 0.5,
  "LoginAction": "login"
}
```

Design choices:

- `Enabled` gates the feature operationally.
- `SiteKey` is safe to expose to the browser through runtime config.
- `SecretKey` remains backend-only.
- `MinimumScore` lets production tune bot sensitivity without code changes.
- `LoginAction` keeps browser token generation and backend verification aligned.

The feature remains effectively off unless both keys are configured.

## Frontend Flow

The hosted login page already distinguishes issuer-hosted credential entry from non-issuer redirect handoff. This change keeps that split:

- Non-issuer hosts: unchanged redirect-to-issuer behavior
- Issuer-hosted login page: fetch a reCAPTCHA token before calling the login API

The script loader stays in a small browser utility so the page component remains readable. Script loading is dynamic and only happens when the feature is enabled for the hosted login page.

## Backend Flow

The login API remains the trust boundary:

- Validate the request shape
- Verify reCAPTCHA when enabled
- Only after successful verification, resolve user/workspace and check password
- Continue to issue the same ASP.NET Identity cookie on success

Verification uses the standard Google siteverify HTTP endpoint from the backend. This matches the existing backend-owned login/session model and keeps the secret key out of the browser.

## Error Handling

- Missing or failed reCAPTCHA verification returns a stable `auth_captcha_failed` API error code.
- Temporary verification-service failures return a server error envelope.
- The hosted login page translates those errors through the existing API error localization path.

## Security Notes

- reCAPTCHA tokens are verified server-side and are never trusted from the browser alone.
- Only the public site key is sent to the frontend.
- Issued roles, permissions, tokens, and cookies are unchanged; reCAPTCHA only gates initial credential entry.
