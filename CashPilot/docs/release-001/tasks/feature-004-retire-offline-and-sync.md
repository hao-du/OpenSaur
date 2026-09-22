# Feature 004: Retire Offline-First & Synchronization

## Description
Remove the deprecated Offline-First architecture, Service Worker, offline IndexedDB/LocalStorage sync mechanisms, and backend `PendingTransactions` domain/endpoints.

---

## Tasks

### Item 1: Remove Backend Pending Transactions Feature & Domain
- [x] Remove `PendingTransactionsEndpoints.cs`, `Features/PendingTransactions` folder (handlers, DTOs).
- [x] Remove `PendingTransactionSubmission` entity and configuration (`Infrastructure/Database/Configurations/PendingTransactionSubmissionConfiguration.cs`).
- [x] Remove `DbSet<PendingTransactionSubmission>` from `CashPilotDbContext.cs`.
- [x] Remove `app.MapPendingTransactionsEndpoints()` from `Program.cs`.

### Item 2: Remove Frontend Offline & Pending Features
- [x] Delete `client/src/features/offline` folder entirely.
- [x] Delete `client/src/features/pending` folder entirely.
- [x] Remove offline build modes and scripts from `client/package.json` (`build-offline`, `build-dev-offline`, `dev-offline`).
- [x] Remove `@vitejs/plugin-basic-ssl` and offline port/mode conditions from `client/vite.config.ts`.
- [x] Remove `buildMode.ts`, `offlineStorage.ts`, and `useNetworkStatus.tsx` from `client/src/infrastructure/`.

### Item 3: Clean Up UI References & Service Worker
- [x] Remove `DashboardSyncCard.tsx` from `DashboardPage.tsx` and delete the component.
- [x] Remove offline routes and redirects (`/offline/*`, `/pending-transactions`) from `client/src/App.tsx`.
- [x] Remove Service Worker registration from `client/src/main.tsx` and delete `wwwroot/sw.js` and `wwwroot/staticwebapp.config.json`.
- [x] Clean up offline strings from `translations.ts` and offline menu logic from `DefaultLayout.tsx`.

### Item 4: Clean Up DevOps Pipeline
- [x] Delete `devops/azure-pipelines.offline-static-webapp.yml`.
- [x] Clean up offline URLs (`off.cashpilot.duchihao.com`) from CORS policy in `Program.cs`.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.

