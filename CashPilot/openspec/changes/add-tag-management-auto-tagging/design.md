## Context

CashPilot supports multiple transaction types (BankAccount, CashFlow, Transfer, Exchange) with free-text descriptions but no unified tagging system. The requested feature introduces centralized tag definitions and stored tags on transaction records. The solution must fit existing .NET patterns and keep the data model simple.

## Goals / Non-Goals

**Goals:**
- Provide a first-class tag definition module with CRUD for tag name and matching terms.
- Persist tags on the four target transaction types.
- Keep the persistence model and UI consistent across transaction types.

**Non-Goals:**
- Historical backfill/migration job to auto-tag all existing transactions.
- User-facing analytics redesign beyond exposing stored tags.
- Replacing existing category/business classification mechanisms.

## Decisions

1. Store tags directly on each transaction aggregate record
- Decision: add a `Tags` field to BankAccount, CashFlow, Transfer, and Exchange persistence models and DTOs.
- Rationale: aligns with explicit requirement and keeps reads simple for UI/reporting.
- Alternative considered: many-to-many normalized tag links. Deferred to future if advanced tag analytics require it.

## Risks / Trade-offs

- [Schema coupling from per-table Tags field] -> Keep mapper and DTO conversion centralized to reduce drift.

## Migration Plan

1. Add schema changes for `Tags` fields and tag definition tables.
2. Release Tag Management UI for administrators/users.
3. Keep transaction handlers writing stored tags consistently across supported transaction types.

## Open Questions

- Should `Tags` be stored as names, ids, or serialized objects in each transaction table?
- What maximum number of tags per transaction should be enforced?
