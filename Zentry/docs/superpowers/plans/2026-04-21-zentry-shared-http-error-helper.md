# Zentry Shared HTTP Error Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract reusable frontend API error helpers into infrastructure so multiple features can share consistent Axios error parsing and status detection.

**Architecture:** Add a small shared helper module under `client/src/infrastructure/http/` that owns generic Axios error inspection. Update the OIDC client feature to import those helpers and remove the feature-specific error helper names, while leaving request config and endpoint calls in the feature API module.

**Tech Stack:** TypeScript, Axios, React Query, Vite

---

### Task 1: Add shared HTTP error helpers

**Files:**
- Create: `src/OpenSaur.Zentry.Web/client/src/infrastructure/http/apiErrorHelpers.ts`

- [ ] Add `getCommonApiErrorMessage(error, fallback)` to preserve the existing lookup order: `detail`, first validation error, `title`, Axios message, fallback.
- [ ] Add `isApiErrorStatus(error, statusCode)` as a generic Axios status matcher.
- [ ] Keep the file focused on shared HTTP error behavior only.

### Task 2: Refactor the OIDC client API module to use shared helpers

**Files:**
- Modify: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/api/oidcClientsApi.ts`

- [ ] Remove `getOidcApiErrorMessage` from the OIDC client API file.
- [ ] Remove `isOidcApiForbiddenError` from the OIDC client API file.
- [ ] Import the shared helpers from `src/OpenSaur.Zentry.Web/client/src/infrastructure/http/apiErrorHelpers.ts`.
- [ ] Keep `createRequestConfig` and the OIDC request functions unchanged apart from helper imports.

### Task 3: Update OIDC hooks to use the shared helper names

**Files:**
- Modify: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/hooks/useCreateOidcClient.ts`
- Modify: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/hooks/useEditOidcClient.ts`
- Modify: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/hooks/useDeleteOidcClient.ts`
- Modify: `src/OpenSaur.Zentry.Web/client/src/features/oidc-clients/hooks/useOidcClientsQuery.ts`

- [ ] Update create, edit, and delete hooks to call `getCommonApiErrorMessage(...)`.
- [ ] Update the list query hook to use `isApiErrorStatus(query.error, 403)` for forbidden detection.
- [ ] Keep user-facing fallback strings unchanged.

### Task 4: Verify the frontend build and unchanged behavior

**Files:**
- Modify: none

- [ ] Run `npm run build-dev` in `src/OpenSaur.Zentry.Web/client`.
- [ ] Confirm the build passes without import or type errors.
- [ ] Note that manual runtime verification is still needed for OIDC create/edit/delete error messaging and Applications `403` routing behavior.
