# Feature 007: Kafka Consumer Background Job for User Sync

## Description
Replace manual/FDW user synchronization with an event-driven Kafka consumer background service in CashPilot. The consumer subscribes to the `zentry-user-sync` topic published by Zentry, receives `UserSyncEvent` messages, upserts user identity, workspace, roles, and permissions into CashPilot's `Users` table, and invalidates the user's profile cache.

---

## Tasks

### Item 1: Kafka Configuration & Event Contract
- [x] Add `Confluent.Kafka` package to `OpenSaur.CashPilot.Web.csproj`.
- [x] Add `KafkaOptions` configuration model (BootstrapServers, SecurityProtocol, SaslMechanism, Credentials, SslCaCertificate, UserSyncTopic, GroupId, Enabled).
- [x] Add default `Kafka` section to `appsettings.json` and `appsettings.Production.json`.
- [x] Create `UserSyncEvent` contract matching Zentry's published schema.

### Item 2: Kafka Consumer Background Service & User Upsert
- [x] Implement `KafkaUserSyncConsumerService : BackgroundService`.
- [x] In consumer loop, consume messages from `zentry-user-sync` topic with error handling and manual/auto offset commit.
- [x] In a scoped service provider, upsert the incoming user into `CashPilotDbContext.Users` matching the SQL mapping logic (Id, Email, UserName, Names, Workspace, UserSettings, Roles, Permissions, IsActive, UpdatedOn).
- [x] Invalidate user profile cache (`CacheConstants.ProfileKey(userId)`).

### Item 3: Service Registration & Verification
- [x] Register `KafkaOptions` and `AddHostedService<KafkaUserSyncConsumerService>()` in `Program.cs`.
- [x] Handle disabled state gracefully when Kafka is disabled or `BootstrapServers` is empty.
- [x] Verify `dotnet build` succeeds.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.
