| Task | Status | Notes |
| --- | --- | --- |
| Make transaction list action buttons circular | Done | The edit and delete buttons on transaction cards now use explicit square sizing with full border radius, so they render as circles. |
| Group the side menu by navigation area | Done | Dashboard and Transactions stay at the top, Banks/Currencies/Counterparties now render under a master-data section, and Templates/Tags render under a content section. |
| Fix the cash flow drawer render loop caused by footer auto-tag state | Done | The drawer now stores the auto-tag handler in a ref instead of React state, so editing cash flow no longer retriggers a render loop. |
| Move transaction form and filter actions into the shared drawer footer | Done | Bank account, cash flow, exchange, transfer, and transaction filter drawers now own their action buttons in `DrawerFooter`, with the forms rendering fields only. |
| Move the transaction type form drawers to the shared Drawer component | Done | Bank account, cash flow, exchange, and transfer drawers now use `Drawer`, `DrawerHeader`, and `DrawerBody` instead of `DrawerPanel`. |
| Disable the transfer header amount field in add/edit transfer transactions | Done | The transfer header amount now renders read-only and no longer carries a required validation rule; the transfer save flow still uses the detail total. |
| Use the shared drawer error slot in template populate drawers | Done | The populate wrappers now pass the error through `DrawerBody errorMessage`, so the shared drawer handles the alert rendering. |
| Fix template tag field spillover in template drawers | Done | The shared multi-select now wraps chips and the template field row constrains both columns so the mode switches no longer collide with the tag input. |
| Restore wide drawer sizing for template forms and populate drawers | Done | The template settings drawer and all template populate drawers now pass `width="wide"` again so the tag row and mode controls have room. |
| Move the template populate submit button into the drawer footer | Done | The four type-specific populate drawers now own the submit action in `DrawerFooter`, with the forms reporting submitting state back to the wrappers. |
| Replace the template populate drawers with the shared Drawer component | Done | The populate selector and all type-specific populate drawers now use `Drawer`, `DrawerHeader`, and `DrawerBody` instead of `DrawerPanel`. |
| Split the template populate flow into type-specific drawers | Done | Added `CashFlowPopulateFormDrawer`, `TransferPopulateFormDrawer`, `ExchangePopulateFormDrawer`, and `BankAccountPopulateFormDrawer`, with `TemplatePopulateDrawer` acting as the selector and loader. |
| Move TemplatePopulateDrawer into the template populate folder | Done | The populate drawer now lives under `components/populate` and the page import points to the new path. |
| Move the template settings and filter drawers to the shared drawer footer layout | Done | Template settings and filter drawers now use `Drawer`, `DrawerBody`, `DrawerFooter`, and `DrawerHeader`, with submit actions in the footer. |
| Move the tag form and filter drawers to the shared drawer footer layout | Done | Tag create/edit and filter drawers now use `Drawer`, `DrawerBody`, `DrawerFooter`, and `DrawerHeader`, with actions in the footer. |
| Move the currency filter to the shared drawer footer layout | Done | Currency filter now uses `Drawer`, `DrawerBody`, `DrawerFooter`, and `DrawerHeader` with the filter actions in the footer. |
| Move the currency form submit button into the shared drawer footer | Done | `CurrencyForm` now renders fields only, and `CurrencyFormDrawer` owns the submit button in `DrawerFooter`. |
| Remove the edit-only counterparty active toggle | Done | Editing counterparties now keeps the current active state without exposing an `isActive` checkbox in the form. |
| Move the counterparty form submit button into the shared drawer footer | Done | CounterpartyForm now renders fields only, and CounterpartyFormDrawer owns the submit button in DrawerFooter. |
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
| Refactor transaction validators and entity checks | Done | Transaction validators now use named enum bounds and shared validation messages, transaction-item mapping is centralized, and owned entity existence checks are handled by narrow transaction helpers. |
| Reduce backend transaction SOLID friction | Done | Added narrow transaction validation helpers, centralized transaction-item mapping, and extracted transaction validation messages to reduce duplication without introducing a broad repository abstraction. |
| Split transaction aggregation and bank-account movement responsibilities | Done | Transaction list/dashboard/calendar queries now flow through per-aggregate query providers, and bank-account movement sync logic lives in a dedicated manager instead of the form handlers. |
| Simplify bank-account movement DI | Done | Removed the unnecessary bank-account movement interface and registered the concrete manager directly in DI. |
| Reduce transaction validator public surface | Done | Transaction request validators and helper interfaces that are only used internally are no longer public API. |
| Add AI Auto Tag button for transactions | Done | Added OpenSpec slice, backend OpenRouter suggestion endpoint, form/list Auto Tag buttons, and runtime `AutoTagging__ApiKey` configuration. |
| Add month navigation and today highlight to the dashboard calendar | Done | Added previous/next month buttons to `DailyInOutCalendarCard` and highlighted the current day. |
| Reduce transaction list amount text size and weight | Done | Lowered the transaction list amount font size further and removed the bold weight so the value reads lighter. |
| Add a bank-only drawer shell with fixed footer | Done | Replaced the bank form's shared drawer wrapper with a dedicated three-section drawer so the footer stays anchored at the bottom without changing the other modules. |
| Introduce a new common three-section drawer organism | Done | Added a reusable `AppDrawer` shell with Header, Body, and Footer slots and migrated only the bank form to prove the layout before any broader rollout. |
| Rename the reusable drawer file to `Drawer.tsx` | Done | Moved the new common drawer to `Drawer.tsx`, kept `AppDrawer.tsx` as a compatibility re-export, and pointed the bank drawer at the renamed file. |
| Show bank form save errors inside the drawer | Done | Split bank save errors into drawer-local state so submit failures render above the form instead of in the page list area. |
| Move form error rendering into shared drawer body | Done | Added `errorMessage` support to the common `DrawerBody` slot so forms can render their inline error state consistently without duplicating alert layout. |
| Let shared drawer body own the form wrapper | Done | Extended `DrawerBody` to accept form semantics directly so drawers can render the body as the `<form>` element instead of wrapping another Stack around it. |
| Make shared drawer footer accept action lists | Done | Changed `DrawerFooter` to accept an `actions` array so form drawers can pass button lists explicitly and keep the footer contract consistent. |
| Restore footer submit wiring for bank drawer | Done | Added a form id to `DrawerBody` and linked the footer action to it so the fixed bottom button submits the body form again. |
