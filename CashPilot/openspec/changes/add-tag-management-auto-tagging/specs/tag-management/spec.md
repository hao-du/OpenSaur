## ADDED Requirements

### Requirement: User can manage tag definitions
The system SHALL provide a Tag Management interface and API that allow users to create, update, list, and delete tags. Each tag MUST include a display name and MAY include multiple matching terms.

#### Scenario: Create a tag with matching terms
- **WHEN** a user submits a new tag name and one or more matching terms
- **THEN** the system stores the tag and terms and returns it in the tag list

#### Scenario: Update an existing tag definition
- **WHEN** a user edits a tag name or matching terms and saves changes
- **THEN** the system persists the updated tag definition

#### Scenario: Delete a tag definition
- **WHEN** a user deletes a tag from Tag Management
- **THEN** the system removes that tag from the available tag list
