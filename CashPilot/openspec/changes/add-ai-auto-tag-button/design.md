## Context

CashPilot already stores tag definitions with matching terms and persists selected tag names on each transaction aggregate. Transaction forms use a shared tag autocomplete, and the transaction list already displays stored tags. The new behavior needs to call an external AI model without exposing provider credentials to the browser.

## Goals / Non-Goals

**Goals:**
- Provide a backend-only OpenRouter integration for suggesting tags.
- Suggest only active tag definitions that belong to the current user.
- Let users invoke suggestions from transaction forms and transaction list actions.
- Keep suggested tags editable before the user saves.

**Non-Goals:**
- Automatic background tagging or historical backfill.
- Creating new tag definitions from AI output.
- Replacing matching-term management or manual tag editing.
- Storing AI prompt/response audit records.

## Decisions

1. Use a CashPilot backend endpoint as the only caller of OpenRouter.
- Rationale: the API key remains server-side and the endpoint can enforce user ownership.
- Alternative considered: direct browser call to OpenRouter. Rejected because it exposes the API key.

2. Send the current description plus active tag definitions and matching terms to the model.
- Rationale: the model has enough context to choose from existing tags without needing database writes.
- Alternative considered: deterministic local matching only. Deferred because the requested slice specifically asks to use the AI model.

3. Require the model to return JSON and filter the response against active tag names.
- Rationale: filtering protects against invented tags and malformed responses.
- Alternative considered: trusting the model response directly. Rejected because tags are user-owned domain data.

4. Keep form buttons as suggestion actions, not save actions.
- Rationale: the user can review/edit tags before saving, matching the existing manual workflow.
- Alternative considered: auto-save suggested tags from list rows. Deferred to avoid surprising mutation from a list action.

## Risks / Trade-offs

- [External model is unavailable or rate-limited] -> Return a problem response and keep the existing form/list unchanged.
- [Model returns invalid JSON or invented tags] -> Parse defensively and filter to active tag definitions.
- [Descriptions can contain sensitive financial details] -> Send only the current description and tag metadata needed for classification, not the full transaction history.
- [The provided API key may rotate] -> Use configuration so operations can update it without code changes.
