# Feature Technical Documentation: Frontend Architecture

This document provides a technical overview of the CashPilot React frontend, its architectural patterns, and key implementation details.

## 1. Overview
The frontend is a modern Single Page Application (SPA) built with **React 19** and **Vite**. It is designed to work both as a standard web application and as an **Offline-capable** application, allowing users to interact with data even without an active internet connection.

## 2. Core Tech Stack

- **Framework**: React 19 (Functional Components, Hooks)
- **Routing**: `react-router-dom`
- **Data Fetching**: `TanStack Query` (React Query)
- **Form Management**: `React Hook Form`
- **Styling**: `Material UI (MUI)` with a custom theme
- **State Management**: 
    - `React Context API` (for Auth and Global App state)
    - `TanStack Query` (for server state/caching)
- **Build Tool**: `Vite`
- **Language**: TypeScript

## 3. Architecture & Patterns

### Folder Structure
The application follows a feature-based architecture to ensure scalability and maintainability:
- `src/components/`: Reusable UI components (Buttons, Inputs, Layouts).
- `src/features/`: Domain-specific modules. Each feature contains its own:
    - `components/`: Feature-specific UI.
    - `hooks/`: Feature-specific logic and data fetching.
    - `pages/`: Page-level components (routed).
    - `services/`: API interaction logic.
    - `dtos/`: Type definitions for API requests/responses.
    - `stores/`: (Optional) Local state management.
- `src/infrastructure/`: Cross-cutting concerns:
    - `auth/`: Authentication logic (OIDC, JWT, Context).
    - `http/`: API client configuration (Axios/Fetch wrappers).
    - `offline/`: Logic for IndexedDB and offline data sync.
    - `theme/`: MUI theme configuration.
    - `config/`: Environment and build-mode configuration.
- `src/App.tsx`: Main router and top-level provider configuration.

### Authentication Flow
1. **Authentication Context**: `AuthContext` manages the current `authSession` and `isRestoring` state.
2. **Guarding Routes**: The `App.tsx` uses `isRestoring` and `authSession` to protect routes, redirecting unauthenticated users to the `PrepareSessionPage`.
3. **OIDC Integration**: Authentication is handled via `AuthCallbackPage`, which processes the callback from the OIDC provider and completes the session.

### Offline-First Strategy
The application uses a "Dual-Mode" approach based on `isOfflineMode()`:
1. **Online Mode (Default)**: Standard SPA behavior fetching data from the backend API.
2. **Offline Mode**:
    - **Routing**: Users are redirected to `/offline/transactions`.
    - **Storage**: Data is persisted in **IndexedDB** via the `offline` infrastructure services.
    - **Syncing**: Transactions created while offline are stored as `OfflineTransactionRecord`s and synchronized to the server once connectivity is detected.
    - **Templates**: Users can use pre-defined templates to populate forms even when offline.

## 4. Key Implementation Details

### Data Fetching Pattern
All API interactions are encapsulated within custom hooks using `TanStack Query`. This provides:
- Automatic caching and background synchronization.
- Loading and error states.
- Declarative data management.

### Form Handling
`React Hook Form` is used in conjunction with `FluentValidation` (on the backend) to provide robust, performant form validation.

## 5. Debugging & Troubleshooting

- **Frontend Environment**: Use `import.meta.env.MODE` to check the build mode.
- **Offline Simulation**: To test the offline experience, use a hostname starting with `off.` (as configured in `buildMode.ts`) or trigger the `dev-offline` mode.
- **React DevTools**: Highly recommended for inspecting the `AuthContext` and `TanStack Query` cache.
- **Browser DevTools (Application Tab)**: Essential for inspecting the **IndexedDB** state during offline testing.

## 6. Dependencies

- `react-router-dom` (Routing)
- `@mui/material` (UI Components)
- `@tanstack/react-query` (Data Fetching)
- `react-hook-form` (Forms)
- `axios` (HTTP Client)
