# Plan: Implement Transaction Reports Prototype

## Context
The user wants to implement a new feature for "Transaction Reports" using MUI X Charts. The initial goal is to create a prototype that includes a new side menu item and the basic routing/component structure.

## Completed Steps

### 1. `src/OpenSaur.CashPilot.Web/client/src/features/reports/pages/ReportsPage.tsx`
#### [Action: Create]
- **Change**: Created placeholder component with "Transaction Reports" heading.

### 2. `src/OpenSaur.CashPilot.Web/client/src/App.tsx`
#### [Action: Update]
- **Context**: Below `import { PendingTransactionsPage } from "./features/pending/pages/PendingTransactionsPage";`
- **Change**: Added `import ReportsPage from "./features/reports/pages/ReportsPage";`
- **Context**: Below `<Route element={<TagsPage />} path="/tags" />`
- **Change**: Appended `<Route element={<ReportsPage />} path="/reports" />`

### 3. `src/OpenSaur.CashPilot.Web/client/src/components/organisms/SideMenu.tsx`
#### [Action: Update]
- **Context**: In `navigationIcons`, above `"building-2": Building2,`
- **Change**: Added `"chart-bar": ChartBar,` (Note: This was already present but verified)
- **Context**: In `navigationLabelKeys`, add `"/reports": "nav.reports"`
- **Change**: Added the mapping for the reports route.
- **Context**: In `navigationGroups`, in the first group object, change `paths: ["/", "/transactions"]`
- **Change**: Updated to `paths: ["/", "/documents", "/transactions", "/reports"]` (Note: checking actual content... actually it was `["/", "/transactions", "/reports"]`)

## Proposed Changes (Next Steps)

### 1. `src/OpenSaur.CashPilot.Web/client/src/features/reports/pages/ReportsPage.tsx`
#### [Action: Update]
- **Context**: Inside the component return statement.
- **Change**: Replace simple heading with `<LineChart />` and `<BarChart />` components from `@mui/x-charts`.

## Verification
- [x] Verify that clicking the new "Transaction Reports" item in the `SideMenu` navigates the user to the correct URL.
- [x] Confirm that the `ReportsPage` component renders correctly without errors.
- [x] Ensure no existing routes or menu items are broken by the addition.
