## 1. Backend Support

- [x] 1.1 Add role-assignment read support for role-scoped current assignments in managed scope.
- [x] 1.2 Add active candidate-user read support for role-assignment editing in managed scope.
- [x] 1.3 Add or update backend tests for super-admin, impersonated super-admin, and out-of-scope access behavior.

## 2. Global Roles UI

- [x] 2.1 Replace the placeholder `Roles` page with a real role list for super-admin sessions.
- [x] 2.2 Implement create/edit role flows for metadata and permissions using the existing role and permission APIs.
- [x] 2.3 Ensure role-definition actions remain available for super-admin sessions, including impersonated super-admin sessions, while non-superadmin sessions cannot access `Roles`.

## 3. Role Assignments UI

- [x] 3.1 Add the `Role Assignments` route and shell navigation visibility rules for impersonated super-admin sessions.
- [x] 3.2 Build the role-assignment page with role list, assigned-user editor, and workspace-scoped active-user picker.
- [x] 3.3 Implement assignment add/remove save flows backed by the user-role APIs and new read support.

## 4. Verification

- [x] 4.1 Add frontend tests for route visibility, role page access modes, and role-assignment editor behavior.
- [x] 4.2 Run targeted frontend tests, targeted backend tests, `npm run build`, `dotnet build`, and `openspec validate identity-fe-phase-5-roles-and-assignments`.
