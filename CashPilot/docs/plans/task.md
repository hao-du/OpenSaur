| Task | Status | Notes |
| --- | --- | --- |
| Tag management and persisted transaction tags | Done | Tag CRUD, `Tags` fields, and UI rendering remain in place. |
| Remove model-based tag runtime wiring | Done | Deleted the tag model service, options, package reference, and appsettings sections; auto-tagging now returns no predictions. |
| Fix Transfer description rendering and preserve Transfer form state when switching tabs | Done | Keep Transfer form mounted across tabs and show the transfer header description in the transaction list. |
| Restore BankAccount form spacing after preserving tab subtree state | Done | Reintroduced the internal stack wrapper so the form regains vertical spacing. |
| Add default tags to templates and seed them into populated transactions | Done | Template settings now store `templateData.tags`, and populate forms seed transaction tags from the template. |
| Hide template tags in populate forms when `showUi` is off | Done | The template tag field remains configurable in settings, but it no longer renders in transaction populate forms when hidden. |
| Remove active status columns from template and tag lists | Done | The list pages still support active/inactive state in data and filters, but the table columns no longer display the status chips. |
| Render template types as colored chips in the list view | Done | The Templates table now shows the type column as a colored chip using the existing template type color tokens. |
| Render tag matching terms as chips in the list view | Done | The Tags table now shows matching terms as chips, shows a translated hidden-count chip when there are more than three, and uses a chip for empty matching terms. |
| Open hidden tag matching terms from the list view | Done | Hovering the hidden-count chip shows the remaining matching terms for that tag in a tooltip. |
| Revert the shared tag input rename and auto-create toggle | Done | Restored `CreatableMultiSelect` and the tag wrapper with the original creatable behavior. |
| Persist new tag definitions only on save | Done | Backend tag service upserts new tag names during transaction/template save flows instead of creating them on Enter in the tag field, and the shared tag input now commits pending typed text on blur so Save sees it. |
| Extract template JSON codec from the form | Done | Moved template data parsing/serialization into `TemplateDataCodec` and switched template labels to template-specific translation keys. |
| Split template drawer effect concerns | Done | Moved type reset, date auto-fill, and default-value seeding logic into dedicated drawer effect helpers. |
| Reusable tooltip chip for truncated tag terms | Done | Added `TooltipChip` and used it for the hidden matching-term count in the Tags list. |
| Trim the creatable tag input helper surface | Done | Moved shared normalization helpers into `creatableMultiSelectUtils` and removed the dead create-on-select path. |
| Remove duplicate confirmation dialog and shared error helper copies | Done | Deleted the duplicate organism dialog implementation and switched CRUD pages to the shared `getApiErrorMessage` helper. |
| Remove dead success state from Tags page | Done | The Tags page no longer carries an unused success alert path. |
| Extract shared list state and boolean chip primitives | Done | Added reusable loading/empty list panel handling and a boolean chip atom, then applied them across the master-data lists. |
| Remove legacy green border styling and cross-feature filter labels | Done | Replaced stale hardcoded borders with theme-derived alpha colors and switched shared filter labels/actions to common keys. |
| Normalize transaction type chip styling | Done | Transaction type chips now reuse the existing CSS variables instead of hardcoded per-page hex values. |
| Centralize numeric display formatting | Done | Shared amount/input formatting now lives in `infrastructure/constants/numberFormatters.ts` and is reused by the number input atom and transaction editors. |
| Split the transaction list/dashboard page | Done | The transaction page now delegates the left list and right dashboard columns into dedicated panels and moves page-local edit state types into a shared DTO module. |
| Extract shared CRUD page state | Done | Bank, currency, counterparty, tag, and template pages now use the shared `useCrudPageState` hook instead of carrying local open/edit/delete boilerplate. |
| Add shared transaction enums and form sections | Done | Transaction directions/statuses and the repeated bordered form blocks now use shared constants/atoms instead of repeated inline values and styles. |
| Extract transaction form initial-value helpers | Done | Bank account, cash flow, and exchange forms now reuse helper functions for default/reset state instead of duplicating the same mapping logic. |
| Standardize remaining transaction UI abstractions | Done | Consolidated transaction type label helpers, added a reusable type chip, moved cash flow form state into the form component, and replaced remaining raw transaction form buttons with the shared button atom. |
| Move feature-specific type chips out of atoms | Done | The template type chip now lives under the templates feature instead of the generic atom layer. |
| Extract a shared generic DataTable organism | Done | The master-data list pages now share a generic table shell with centralized loading and empty-state handling. |
| Fix React Fast Refresh and effect-based form reset warnings | Done | Moved the localization provider out of `main.tsx`, removed the exported helper from the bank-account transaction form, and switched transaction forms to remount cleanly via drawer keys instead of resetting state in effects. |
| Fix transfer template currency toggle affecting amount auto-fill | Done | Removed the transfer template default-value write that was forcing `templateData.amount.autoPopulate` to false whenever unrelated template fields changed. |
| Add bank-account template interest-rate range validation | Done | Bank-account template interest rate now validates 0 to 100 when auto-fill is enabled, with localized range messaging. |
