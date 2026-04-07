## Why

After the permission-model simplification and the new `Umbraco.CanManage` permission, the roles editor can save updated permission selections but reopen with stale role detail data. That makes successful saves appear to fail from the admin user's perspective.

## What Changes

- Refresh the edited role detail query after a successful role save.
- Ensure the roles editor reopens with the latest persisted permission selections.
- Document the expected post-save refresh behavior in the roles frontend spec.

## Capabilities

### Modified Capabilities

- `identity-fe-roles`: Reopening a role editor after a successful save reflects the latest persisted permission selections.

## Impact

- Role edit mutation handling under `src/OpenSaur.Identity.Web/client/src/features/roles/`
- Hosted roles page behavior under `src/OpenSaur.Identity.Web/client/src/pages/roles/`
