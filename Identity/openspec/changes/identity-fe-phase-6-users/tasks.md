## 1. OpenSpec

- [x] 1.1 Add the `identity-fe-users` capability spec for workspace-scoped user management.
- [x] 1.2 Update `identity-authentication` and `identity-directory-management` specs for `/api/auth/me` capability data and the new user-management access rules.

## 2. Backend Access And Read Support

- [x] 2.1 Add a dedicated backend access rule for workspace-scoped user management and apply it to the relevant user and user-role endpoints.
- [x] 2.2 Extend `/api/auth/me` to return the hosted `Users` access capability.
- [x] 2.3 Add user-scoped user-role read support and backend tests for all-workspaces, `Personal`, and allowed org-workspace behavior.

## 3. Users UI

- [x] 3.1 Replace the placeholder `Users` page with a real list, filter drawer, and route visibility driven by the new session capability.
- [x] 3.2 Build the user editor drawer with core user fields and assigned-role management.
- [x] 3.3 Implement the combined save flow for user details and role assignments while preserving filters after successful save.

## 4. Verification

- [x] 4.1 Add frontend tests for route visibility, `Users` page rendering, filter behavior, and editor save behavior.
- [x] 4.2 Run targeted frontend tests, targeted backend tests, `npm run build`, `dotnet build`, and `openspec validate identity-fe-phase-6-users`.
