# Frontend Patterns

## Tech Stack
React 19, Vite, TypeScript, TanStack Query, React Context, MUI, Lucide React, React Router, React Hook Form, Axios, Day.js.

## Directory Structure
- `src/features/{domain}/` — Feature modules, each containing:
  - `components/`, `hooks/`, `provider/`, `services/`, `types.ts`
- `src/components/` — Shared reusable components
  - `providers/` — Global providers (e.g., `AppLocalizationProvider`)
- `src/infrastructure/` — Core infra: `theme/`, `styles/`
- `src/hooks/` — Shared global hooks
- `src/types/` — Global type definitions

## Conventions
1. **Data Fetching**: Wrap `useQuery`/`useMutation` in custom hooks (never call directly in components). Leverage caching/invalidation. Handle loading/error states.
2. **Feature Isolation**: Keep domain logic within its `src/features/` folder.
3. **MUI Theming**: Use `useTheme`/`sx` prop; no hardcoded colors/spacing. Use shared components for consistency. Use MUI layout components (`Box`, `Stack`, `Grid`).
4. **Forms**: Use `react-hook-form`; keep form state local.
5. **Routing**: Use `react-router-dom` hooks; define routes centrally.
6. **TypeScript**: All components/functions typed. Define interfaces in feature/component folders.
7. **i18n**: Use `AppLocalizationProvider` and localization hooks.
