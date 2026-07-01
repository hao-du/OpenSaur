# Feature Technical Documentation: Offline Mode (Frontend)

This document details the client-side implementation of the offline-first capability, allowing users to continue working when connectivity is lost.

## 1. Overview
The Offline Mode allows the application to capture user actions (primarily transactions) locally and synchronize them with the server once the connection is restored. It uses **IndexedDB** for persistent storage and a **Service Worker**-driven approach to handle background synchronization.

## 2. Architecture & Component Map

### Local Storage (IndexedDB)
The application uses a specialized local storage layer via the `infrastructure/offline` services to manage data persistence in the browser.
- **`OfflineTransactionsStore`**: The primary store for `OfflineTransactionRecord` objects.
- **`OfflineMetadataStore`**: Stores synchronization metadata and configuration.
- **`OfflineTemplatesStore`**: Stores user-defined templates to pre-populate forms while offline.

### Core Logic & Data Flow

#### A. Data Capture (The "Draft" State)
When a user creates a transaction (e.g., via `CashFlowFormDrawer`) while offline:
1.  The `offlineTransactionFormUtils.ts` is used to build an `OfflineTransactionRecord`.
2.  The record includes a `payloadJson` which contains the serialized form data (e.g., `CashFlowDetailDto`).
3.  The record is saved into the `OfflineTransactionsStore`.

#### B. Synchronization (The "Sync" Process)
The synchronization process is triggered when the application detects it has returned online.
1.  **Detection**: The `isOfflineMode()` check (via `buildMode.ts`) and network status events trigger the sync flow.
2.  **Retrieval**: The system reads all records from `OfflineTransactionsStore`.
3.  **Execution**: The system iterates through the records and attempts to "replay" the original API calls (e.g., calling `POST /api/transactions/cashflows/create` using the data in `payloadJson`) on the server.
4.  **Resolution**:
    - **Success**: The local record is removed from IndexedDB.
    - **Error/Conflict**: The record is marked with an error state or kept in the store for manual retry/resolution.

#### C. Form Pre-population (Templates)
To ensure a high-quality UX offline, the system uses **Templates**:
- Users can save a template (e.g., "Monthly Rent").
- When offline, the `build...InitialValue` functions in `offlineTransactionFormUtils.ts` use the template data + the current date to reconstruct a valid, editable form state.

## 3. Authentication & Protected Actions

Because offline data is sensitive, actions that require server communication (like importing metadata or submitting transactions) are protected by the OIDC authentication layer.

### The "Redirect-to-Auth" Workflow
If a user attempts to trigger a protected action (e.g., clicking "Import Metadata" or "Submit Review") while they are unauthenticated, the application performs a seamless "intercept and return" flow:

1.  **The Trigger**: The user clicks a protected button in the `OfflineTransactionsPage`.
2.  **The Guard**: The component checks `authSession` (from `useAuthSession`).
3.  **The Redirection (State Preservation)**:
    - If no session exists, the application navigates to `/prepare-session`.
    - A `state` object is passed to the navigation, containing a `returnTo` URL (e.g., `/offline/transactions?importMetadata=1`).
4.  **The Handshake**:
    - The app redirects the user to the external OIDC Provider.
    - The user authenticates with the provider.
    - The provider redirects the user back to the application's `/auth/callback` route.
5.  **The Re-entry**:
    - The `AuthCallbackPage` exchanges the authorization code for an access token.
    - Upon successful login, the application reads the `returnTo` parameter from the navigation state and redirects the user back to their original intent (the `OfflineTransactionsPage` with the query parameters).
6.  **The Auto-Execution**: The `OfflineTransactionsPage` detects the query parameters (e.g., `importMetadata=1`) and automatically triggers the requested action.

### Management Actions (Offline Transactions Page)

The `OfflineTransactionsPage` provides two primary management actions that trigger the workflow above:

1.  **Import Metadata (Import Action)**
    - **Purpose**: Fetches the latest metadata (currencies, banks, counterparties, tags) from the server to refresh the local offline state.
    - **Requirement**: Requires an active user session.
    - **Effect**: Re-syncs the `OfflineMetadataStore` in IndexedDB.

2.  **Submit for Review (Sync Action)**
    - **Purpose**: The final step in the offline workflow. It takes all locally stored transactions and pushes them to the server to be processed into the main ledger.
    - **Requirement**: Requires an active user session and at least one local transaction record.
    - **Effect**: Invokes the server-side synchronization logic and clears the local transaction queue upon successful processing.

## 4. Debugging & Troubleshooting

- **Inspecting Local Data**: Use **Chrome/Edge DevTools -> Application Tab -> IndexedDB** to see exactly what is queued for sync.
- **Simulating Offline**:
    - Use the "Network" tab in DevTools to toggle "Offline".
    - Or, use the build-mode logic: access the app via a hostname starting with `off.` (e.g., `http://off.localhost:3000`).
- **Sync Errors**: If a sync fails, check the `OfflineTransactionsPage` in the UI, which displays the status of queued transactions.
- **Console Logs**: Monitor for errors related to `OfflineTransactionRecord` parsing or `payloadJson` corruption.
