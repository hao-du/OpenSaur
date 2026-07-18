## 1. Configuration And Hosting

- [x] 1.1 Add a configurable Umbraco app base path and set it to `/cms`
- [x] 1.2 Mount the ASP.NET Core / Umbraco pipeline under the configured base path
- [x] 1.3 Update local launch settings to open `/cms/umbraco`

## 2. OIDC Route Shape

- [x] 2.1 Ensure OIDC callback/logout routes inherit the base path
- [x] 2.2 Preserve existing backoffice external-login behavior under the new mounted path

## 3. Verification

- [x] 3.1 Build the Umbraco project successfully
- [x] 3.2 Run the app and verify `/cms/umbraco` and `/cms/signin-oidc` route shape
