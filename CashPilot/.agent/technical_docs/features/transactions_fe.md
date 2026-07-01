# Feature Technical Documentation: Transactions (Frontend)

This document provides a technical breakdown of the Transactions feature implementation in the React frontend.

## 1. Overview
The Transactions page is a complex dashboard that allows users to view, filter, create, edit, and delete various transaction types. It integrates several domain models (Banks, Counterparties, Currencies) and provides tools for data management (Auto-tagging, Filtering).

## 2. Architecture & Component Map

### Main Component: `TransactionsPage.tsx`
The orchestrator for the entire transaction management experience.

**Key State Management:**
- **Modals/Drawers**: Local state controls the visibility of `CashFlowFormDrawer`, `BankAccountFormDrawer`, `TransferFormDrawer`, and `ExchangeFormDrawer`.
- **Editing State**: Tracks which specific transaction is being edited (`editingCashFlow`, `editingTransferMovement`, etc.).
- **Filtering**: Manages complex filter criteria (date ranges, transaction types, description).
- **Pagination**: Handles server-side/client-side pagination state.

### UI Component Hierarchy
- `DefaultLayout`: Provides the standard page structure and header actions.
- **Header Actions**: Contains a `CreateMenu` (to select transaction type) and a `FilterDrawer`.
- **Main Content Area (Grid)**:
    - `TransactionListPanel`: Displays the paginated list of transactions.
    - `TransactionDashboardPanel`: Provides visual summaries (Income/Outcome) and statistical cards.
- **Drawers (Forms)**: Modal-like views for creating/editing specific transaction types.
- **Modals**: `ConfirmModal` for safe deletion.

### Data & API Layer
- **`useTransactionsQuery`**: Fetches the main list of transactions based on current filters.
- **`useTransactionDashboardQuery`**: Fetches summary data (income/outcome).
- **Mutation Hooks**: Custom hooks for all write operations:
    - `useCreateCashFlowMutation`, `useUpdateCashFlowMutation`
    - `useCreateBankAccountMutation`, `useUpdateBankAccountMutation`
    - `useCreateTransferMutation`, `useUpdateTransferMutation`
    - `useCreateCurrencyExchangeMutation`, `useUpdateCurrencyExchangeMutation`
    - `useDeleteTransactionMutation`
- **`transactionsApi.ts`**: The raw API communication layer (GET/POST/PUT/DELETE).

## 3. Implementation Detail: Complex Workflows

### A. The "Edit" Workflow (Polymorphic Loading)
Since "editing" can mean different things for different transaction types, the `handleEdit` function performs specialized fetching:
1.  **Identify Type**: Determines if it's `CashFlow`, `BankAccount`, `Transfer`, or `Exchange`.
2.  **Specialized Fetch**: Calls the specific API endpoint (e.g., `getTransferFormById`) to get the full context of the movement.
3.  **State Hydration**: Maps the API response into the specific "Editing State" required by the corresponding Drawer (e.g., mapping `TransferForm` to `TransferMovementDraft`).
4.  **Drawer Activation**: Opens the appropriate form with pre-populated data.

### B. The "Create" Workflow (Menu-Driven)
1.  **Menu Trigger**: The user clicks the "Create" button in the header.
2.  **Selection**: The user selects a type (e.g., "Transfer").
3.  **Drawer Initialization**: The corresponding `...Drawer` is opened with an empty/default state.

### C. Auto-Tagging Integration
Integrated directly within the form drawers:
1.  **Trigger**: User clicks "Auto-Tag" within a form.
2.  **Processing**: The `requestAutoTags` function calls the `autoTagMutation`.
3.  **State Update**: On success, the form's `tags` state is updated with the suggested tags from the server, allowing the user to review before saving.

## 4. Key Implementation Details

### Polymorphic List Rendering
The `TransactionListPanel` is responsible for rendering a heterogeneous list of transactions. It uses `TransactionListItemDto` which contains a `type` field to determine which icon/label to display.

### Data Aggregation
The `TransactionDashboardPanel` performs significant data processing:
- **Filtering by Currency**: It filters income/outcome items to match the user's default currency.
- **Visual Summaries**: It aggregates data provided by the `dashboardQuery` into visual components.

## 5. Debugging & Troubleshooting

- **Form Validation Issues**: Check the `onUpdate` and `onSubmit` props in the Drawer components. Errors from the backend are caught in the `submit` wrapper and displayed in a top-level `Alert` component.
- **Filtering/Pagination Issues**: Inspect the `filters` state in the `TransactionsPage` component.
- **Data Inconsistencies**: If a transfer shows incorrect amounts, check the `TransferMovementDraft` mapping logic in `handleEdit`.
- **Network/API Errors**: Use the Browser's Network Tab to ensure the `transactionsApi.ts` calls are hitting the correct endpoints with the expected JSON payloads.
