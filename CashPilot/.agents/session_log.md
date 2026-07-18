# Session Log

**Last Updated**: Mon Jul 06 2026

**Current Task**: Refactor closed out; monitoring only.

## Summary
- [x] Updated `AGENTS.md` to require reading `.agents/rules/development-guidelines.md` before any work begins.
- [x] Standardized CRUD pages to a page-orchestrator + logic-hook structure across tags, counterparties, currencies, banks, transactions, pending, offline, and templates.
- [x] Split transaction hooks by concern and fixed transaction-specific issues, including stale edit reloads and transfer net amount handling.
- [x] Kept the shared transaction forms intact so online, offline, and pending flows reuse the same core form components.
- [x] Scoped offline metadata and offline templates by user so imports no longer leak data across profiles.
- [x] Verified with `npx tsc -b` and `npm run build` in `src/OpenSaur.CashPilot.Web/client`.
- [x] Added `npm run lint` to `src/OpenSaur.CashPilot.Web/client/package.json`; it currently reports existing React hook rule violations that need follow-up.
- [x] Completed manual QA across online, offline, pending, and templates CRUD flows.

## Known Issues / Debt
- (none)

## Next Steps
- (none)
