## Why

Workspace group provisioning fails during OIDC callback because the group alias was derived from a hyphenated workspace GUID. Umbraco normalizes user group aliases when saving, so the follow-up lookup by the original hyphenated alias can return `null` even when the group was created.

## What Changes

- Use a stable alphanumeric workspace group alias based on `workspace_id`.
- Reuse any existing managed workspace group created by earlier failed attempts.
- Return the successful `IUserGroupService.CreateAsync` result directly instead of requiring a second lookup by alias.
- Surface the Umbraco user group operation status when creation fails.

## Capabilities

### Modified Capabilities
- `backoffice-oidc-authentication`: workspace groups are created and reused reliably during OIDC backoffice login.

## Impact

- Affected code in `src/OpenSaur.Umbraco.Web/Authentication/`.
- No database migration is required.
