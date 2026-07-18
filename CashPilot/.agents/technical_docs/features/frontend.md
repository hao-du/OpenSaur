# Frontend Architecture

## Overview
React 19 SPA with Vite, TypeScript, offline-capable.

## Tech Stack
React 19, react-router-dom, TanStack Query, React Hook Form, MUI (custom theme), React Context + TanStack Query (state), Vite, TypeScript, Axios.

## Folder Structure
- `src/components/` — Reusable UI (buttons, inputs, layouts)
- `src/features/{domain}/` — Feature modules: `components/`, `hooks/`, `pages/`, `services/`, `dtos/`, `stores/`
- `src/infrastructure/` — Cross-cutting: `auth/` (OIDC/JWT), `http/` (API client), `offline/` (IndexedDB), `theme/`, `config/`
- `src/App.tsx` — Router + top-level providers

## Auth Flow
- `AuthContext` manages `authSession` + `isRestoring` state.
- `App.tsx` guards routes; unauthenticated users → `PrepareSessionPage`.
- `AuthCallbackPage` handles OIDC callback and session completion.

## Offline Strategy (Dual-Mode)
- **Online**: Standard SPA fetching from backend API.
- **Offline** (detected via `isOfflineMode()`):
  - Routes to `/offline/transactions`.
  - Persists in IndexedDB via `offline` infra services.
  - Syncs `OfflineTransactionRecord`s on reconnect.
  - Templates pre-populate forms offline.

## Data Fetching
All API calls via custom TanStack Query hooks (auto-caching, loading/error states).

## Debugging
- Build mode: `import.meta.env.MODE`
- Offline simulation: hostname starting with `off.` or `dev-offline` mode
- Tools: React DevTools (AuthContext, Query cache), Browser DevTools (IndexedDB)
