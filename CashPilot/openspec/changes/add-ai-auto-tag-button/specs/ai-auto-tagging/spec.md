## ADDED Requirements

### Requirement: User can request AI tag suggestions
The system SHALL allow an authenticated user to request tag suggestions for a transaction description using the user's active tag definitions.

#### Scenario: Suggest tags from a transaction form
- **WHEN** the user clicks Auto Tag while adding or editing a transaction with a description
- **THEN** the system returns suggested tag names from the user's active tag definitions and applies them to the editable tag field

#### Scenario: Suggest tags from a transaction list item
- **WHEN** the user clicks Auto Tag on an existing transaction list item
- **THEN** the system opens the corresponding edit flow with suggested tags available for review before saving

### Requirement: AI suggestions are constrained to existing tags
The system MUST NOT create new tag definitions or return tag names outside the current user's active tag definitions when generating suggestions.

#### Scenario: Model returns an unknown tag
- **WHEN** the AI provider response contains a tag that is not an active tag definition for the current user
- **THEN** the system excludes that tag from the suggestions returned to the client

### Requirement: Provider credentials stay server-side
The system MUST call the OpenRouter model from the backend using server configuration and MUST NOT expose the provider API key to frontend code.

#### Scenario: Frontend requests auto tagging
- **WHEN** the frontend requests tag suggestions
- **THEN** the browser calls only the CashPilot API and does not receive the OpenRouter API key
