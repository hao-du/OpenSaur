## MODIFIED Requirements

### Requirement: Global role editing SHALL manage role definition and permissions only
The roles editor SHALL let super-admin sessions manage role metadata and permission assignments without exposing assigned-user editing in that editor.

#### Scenario: Reopening an edited role shows the latest permissions
- **WHEN** a super-admin saves updated permission selections for a role
- **AND** later reopens that same role in the editor
- **THEN** the editor loads the latest persisted permission assignments for that role
- **AND** newly added permissions remain selected in the reopened form
