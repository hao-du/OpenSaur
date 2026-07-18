## 1. External Login Cookie

- [x] 1.1 Stop saving OIDC tokens into the external authentication cookie
- [x] 1.2 Preserve access-token claim enrichment during `OnTokenValidated`
- [x] 1.3 Add standard ASP.NET external-login identifier, name, and email claims
- [x] 1.4 Avoid rejecting validated external sign-ins when the Umbraco user cannot be resolved by identity ID alone
- [x] 1.5 Approve and email-confirm auto-linked users
- [x] 1.6 Enable or unlock already-linked users after OpenSaur authorization passes
- [x] 1.7 Assign the current user to the workspace-derived group during both auto-link and synchronization
- [x] 1.8 Assign OpenSaur `SUPERADMINISTRATOR` users to Umbraco's built-in admin group

## 2. Verification

- [x] 2.1 Build the Umbraco project successfully
