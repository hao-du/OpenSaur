## Why

Transaction tagging is currently manual even though tag definitions already carry matching terms. Adding an Auto Tag action reduces repeated typing and makes transaction categorization more consistent while the user is creating, editing, or reviewing a transaction.

## What Changes

- Add an authenticated backend API that suggests tags for a transaction description using configured tag definitions and an OpenRouter chat model.
- Add Auto Tag buttons in add/edit transaction forms next to Save.
- Add an Auto Tag action next to the transaction list edit action so existing rows can request suggested tags before editing.
- Keep the OpenRouter API key in backend configuration and never expose it to the browser.

## Capabilities

### New Capabilities
- `ai-auto-tagging`: Suggest transaction tags from descriptions and configured tag definitions.

### Modified Capabilities
- None.

## Impact

- Backend transaction endpoints and DI for an AI auto-tagging service.
- Backend configuration for OpenRouter endpoint, model, and API key.
- Frontend transaction API, mutation hook, forms, and list action controls.
- Operational configuration must provide `AutoTagging:ApiKey` in development and deployed environments.
