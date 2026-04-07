## 1. Root Hosting

- [x] 1.1 Remove the `/cms` application base path from Umbraco configuration
- [x] 1.2 Remove the `/cms` path-base and compatibility middleware from `Program.cs`
- [x] 1.3 Restore local launch settings to open `/umbraco`

## 2. OIDC Route Shape

- [x] 2.1 Keep external OIDC callback/logout handling at the root app path
- [x] 2.2 Preserve the existing Identity external-login provider integration

## 3. Verification

- [x] 3.1 Build the Umbraco project successfully
- [x] 3.2 Verify `/umbraco` loads without `/cms`-prefixed backoffice asset URLs
