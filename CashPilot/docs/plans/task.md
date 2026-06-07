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
