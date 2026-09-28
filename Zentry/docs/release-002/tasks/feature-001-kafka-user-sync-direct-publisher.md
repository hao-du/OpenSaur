# Feature 001: Direct Kafka User Sync Publisher & Manual Sync

## Description
Implement direct Kafka event streaming for user synchronization to the Aiven topic `zentry-user-sync` on user creations, edits, and role assignments, accompanied by a manual sync API endpoint and a "Sync" action in the React UI.

---

## Tasks

### Item 1: Confluent.Kafka Package & Producer Registration
- [x] Add `Confluent.Kafka` package to `OpenSaur.Zentry.Web.csproj`.
- [x] Configure and register `IProducer<string, string>` as singleton in `Program.cs` supporting SASL/SSL credentials and PEM CA certificate.

### Item 2: User Sync Publisher Service (`IUserSyncPublisher`)
- [x] Create `IUserSyncPublisher` and `KafkaUserSyncPublisher` under `Infrastructure/Messaging/`.
- [x] Implement query resolving user's full model (workspace, active roles, combined permission codes) and publishing `UserSyncEvent`.
- [x] Register `IUserSyncPublisher` in `Program.cs`.

### Item 3: Direct Publish on Direct User Mutations
- [x] Hook `IUserSyncPublisher.PublishUserAsync` in `CreateUserHandler`.
- [x] Hook `IUserSyncPublisher.PublishUserAsync` in `EditUserHandler`.

### Item 4: Direct Publish on Role Assignments
- [x] Hook `IUserSyncPublisher.PublishUserAsync` in `AssignUserRolesHandler` (for single user role changes).
- [x] Hook `IUserSyncPublisher.PublishUsersAsync` in `UpdateRoleUsersHandler` (for batch user role changes).

### Item 5: Manual Sync Endpoint
- [x] Add `POST /api/user/{id:guid}/sync` in `UserEndpoints.cs` and implement `SyncUserHandler`.

### Item 6: Frontend "Sync" Button in Edit User Drawer
- [x] Add "Sync" action with loading feedback in Edit User drawer / user management UI.

### Item 7: Direct Publish on User Settings Updates
- [ ] Hook `IUserSyncPublisher.PublishUserAsync` in `UpdateSettingsHandler` and pass publisher in `SettingsEndpoints.cs` to sync user settings changes (language, time zone).

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval by the user.
