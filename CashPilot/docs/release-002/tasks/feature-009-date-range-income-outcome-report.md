# Feature 009: Date Range Income & Outcome Report

## Description
Provide a report component in `/reports` similar to `IncomeOutcomeChart.tsx`, but allowing filtering across an arbitrary date range (`From Date` and `To Date`) aggregated by Month (`MM/YYYY`). Defaults to the first month and last month of the current year (e.g. `01/01/2026` to `31/12/2026`).

---

## Tasks

- [x] Item 1: Backend Endpoint & Query Handler
  - Add query request DTO `GetIncomeOutcomeByRangeQueryRequest` (`FromDate`, `ToDate`, `TagName?`) and response DTOs `DateRangeIncomeOutcomeResponseItem` & `DateRangeIncomeOutcomeResponse`.
  - Implement `GetIncomeOutcomeByRangeHandler.cs` aggregating monthly totals across the specified date range.
  - Map route `GET /api/reports/income-outcome-by-range`.
  - Verify compilation.

- [x] Item 2: Frontend API Client & Query Hook
  - Add `getIncomeOutcomeByRange` method to `reportsApi.ts`.
  - Create `useIncomeOutcomeByRangeReportQuery.ts` using React Query.
  - Add i18n translation keys in `translations.ts` for English and Vietnamese.

- [x] Item 3: DateRangeIncomeOutcomeChart Component & ReportsPage Integration
  - Create `DateRangeIncomeOutcomeChart.tsx` and `useDateRangeIncomeOutcomeChartLogic.ts`.
  - Support `From Date` and `To Date` month pickers initialized to January and December of current year.
  - Render grouped BarChart (Income vs Outcome) and summary total statistics (In, Out, and Net).
  - Register new report option in `ReportsPage.tsx` dropdown.
  - Verify frontend build and layout.
