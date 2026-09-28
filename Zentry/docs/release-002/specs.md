# Release 002 - User Synchronization via Direct Kafka Event Streaming

## 1. Overview & Objective
Enable real-time, event-driven user synchronization to Kafka (hosted on Aiven) so downstream services (such as **CashPilot**) consume user updates as they occur.

Instead of a database-backed outbox pattern and polling workers, Zentry publishes directly to the Kafka topic `zentry-user-sync` during user mutations, and provides a manual **"Sync"** action on the user management interface to replay or re-synchronize any user's profile, roles, and permissions on demand.

---

## 2. Architecture & Design Specifications

### 2.1 Event Contract (`UserSyncEvent`)
- **Topic**: `zentry-user-sync`
- **Key**: User ID (`Guid.ToString()`) to ensure ordered partitioning per user.
- **Payload Schema**:
  - `id`: Guid (User ID)
  - `email`: string
  - `userName`: string
  - `firstName`: string
  - `lastName`: string
  - `workspaceId`: Guid
  - `workspaceName`: string
  - `userSettings`: string (JSON object)
  - `roles`: string[] (Role names)
  - `permissions`: string[] (Permission codes)
  - `isActive`: bool
  - `updatedOn`: DateTime (UTC)
  - `eventType`: string (`Created`, `Updated`, `ManualSync`)

### 2.2 Direct Publisher (`IUserSyncPublisher`)
- Reads user's latest state (including workspace, active roles, and aggregated permission codes).
- Uses `Confluent.Kafka` `IProducer<string, string>` configured with SASL/SSL credentials.
- Gracefully handles disabled Kafka configurations or transient connection warnings without failing user save operations.

### 2.3 Manual Sync
- **Backend**: `POST /api/user/{id:guid}/sync` endpoint.
- **Frontend**: A "Sync to Kafka" action on the Edit User drawer/page allowing administrators to trigger manual sync with immediate feedback.

---

## 3. Delivery Scope & Tasks
1. `docs/release-002/tasks/feature-001-kafka-user-sync-direct-publisher.md`: Direct publisher implementation, mutation hooks, manual sync endpoint, and frontend sync button.
