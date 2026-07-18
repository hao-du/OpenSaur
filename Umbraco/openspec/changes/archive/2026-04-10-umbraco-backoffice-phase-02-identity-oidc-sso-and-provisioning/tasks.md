## 1. Spec And Configuration

- [x] 1.1 Add the OpenSpec proposal, design, and capability spec for Umbraco backoffice OIDC authentication
- [x] 1.2 Add Umbraco configuration for the Identity issuer, client credentials, reserved callback paths, and login redirection

## 2. OIDC Backoffice Login

- [x] 2.1 Register the Umbraco backoffice external OpenID Connect provider
- [x] 2.2 Parse issuer access-token claims and reject sign-in unless the effective session has `SUPERADMINISTRATOR` or `Umbraco.CanManage`
- [x] 2.3 Add the backoffice login manifest with auto-redirect behavior

## 3. User And Group Provisioning

- [x] 3.1 Auto-provision missing Umbraco users from the effective issuer identity
- [x] 3.2 Create and reuse workspace-based Umbraco user groups named from `workspace_id`
- [x] 3.3 Apply default no-root access for non-superadministrators and full root access for superadministrators

## 4. Verification

- [x] 4.1 Build the Umbraco project successfully
- [x] 4.2 Validate the OpenSpec change successfully
