# Frontend Patterns

This document defines the frontend architectural patterns and conventions for CashPilot.

## Tech Stack
- **Core**: React 19, Vite, TypeScript.
- **State & Data**: TanStack Query (Data fetching/caching), React Context (Global state like Auth/Settings).
- **UI/Styling**: Material UI (MUI), Lucide React (Icons), CSS Modules/Standard CSS.
- **Routing**: React Router.
- **Forms**: React Hook Form.
- **API**: Axios.
- **Date Handling**: Day.js.

## Directory Structure

The application follows a feature-based architecture:

- `src/features/`: Domain-specific logic and components (e.g., `auth`, `settings`, `transactions`).
    - `components/`: UI components specific to this feature.
    - `hooks/`: Custom React hooks for feature-specific logic or data fetching.
    - `provider/`: Context providers for feature-specific state.
    - `services/`: API communication logic for the feature.
    - `types.ts`: TypeScript interfaces/types for the feature.
- `src/components/`: Shared, reusable UI components (atoms/molecules/organisms).
    - `providers/`: Global application providers (e.g., `AppLocalizationProvider`).
- `src/infrastructure/`: Core application infrastructure.
    - `theme/`: MUI theme configuration.
    - `styles/`: Global CSS/Styles.
- `src/hooks/`: Shared, global React hooks.
- `src/types/`: Global TypeScript type definitions.

## Patterns & Conventions

### 1. Data Fetching (TanStack Query)
- **Custom Hooks**: Do not call `useQuery` or `useMutation` directly in UI components. Wrap them in custom hooks within the feature's `hooks/` folder.
- **Caching**: Leverage TanStack Query's caching and invalidation mechanisms to manage server state.
- **Loading/Error States**: Handle loading and error states within the custom hook or via centralized UI components to ensure consistency.

### 2. Feature-Based Organization
- Group all code related to a specific business domain (e.g., `transactions`) within a single folder in `src/features/`.
- Keep feature logic isolated to prevent unintended side effects across the application.

### 3. UI & Styling (MUI)
- **Theming**: Always use the centralized MUI theme via `useTheme` or the `sx` prop. Avoid hardcoded color/spacing values.
- **Consistency**: Use shared components from `src/components/` for common UI elements (buttons, inputs, cards) to maintain visual consistency.
- **Layout**: Use MUI's layout components (`Box`, `Container`, `Grid`, `Stack`) for structural organization.

### 4. Form Management
- Use `react-hook-form` for all complex forms.
- Manage form state locally within the component/feature to keep the global state clean.

### 5. Routing
- Use `react-router-dom` hooks (`useNavigate`, `useParams`, `useLocation`) for navigation and accessing route parameters.
- Define routes in a centralized manner (likely in `App.tsx` or a dedicated router configuration).

### 6. Typescript
- Use TypeScript for all components and functions.
- Define interfaces/types for API responses and component props within their respective feature/component folders.

### 7. Internationalization (i18n)
- Use the provided `AppLocalizationProvider` and localization hooks/context to handle multi-language support.
