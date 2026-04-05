## 1. Specification

- [x] 1.1 Draft proposal, design, tasks, and delta specs for optional Google reCAPTCHA v3 on the issuer-hosted login form

## 2. Runtime Config And Frontend

- [x] 2.1 Expose reCAPTCHA v3 public runtime config from the backend-served shell bootstrap
- [x] 2.2 Acquire a reCAPTCHA v3 token on the issuer-hosted login page before submitting credentials
- [x] 2.3 Localize reCAPTCHA verification failures through the existing login/API error path

## 3. Backend Verification

- [x] 3.1 Add backend options and server-to-server verification for Google reCAPTCHA v3
- [x] 3.2 Verify the reCAPTCHA token before password validation on `/api/auth/login`
- [x] 3.3 Keep the feature disabled by default until site key and secret key are configured

## 4. Documentation And Verification

- [x] 4.1 Update login-flow documentation for issuer-hosted reCAPTCHA v3
- [x] 4.2 Build the backend and frontend successfully without adding automated tests
