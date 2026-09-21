# Feature 005: React Client-Side Consent Screen

**Status**: Completed  
**Target Release**: `release-001`  
**Description**: Redesign the OAuth2 User Consent Screen to be a client-side React component consistent with `LoginPage` and `ChangePasswordPage`, using Material UI theme, `Card`, and `PageLayout`, supported by a backend API to retrieve consent details and submit consent decisions.

---

## Task Breakdown & Implementation Checklist

- [x] **Item 1: Create Consent Details & Decision API Endpoints in CoreGate Web**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/ConsentEndpoints.cs`, `GetConsentDetailsHandler.cs`, `ConsentDecisionHandler.cs`
  - Replace server-rendered HTML endpoint with JSON API:
    - `GET /api/consent?returnUrl=...`: Returns client display name, requested scopes, and return URL details (returns 401 if unauthenticated, redirecting to login).
    - `POST /api/consent`: Accepts `{ decision: "accept" | "reject", returnUrl: string }` and returns `{ redirectUrl: string }`.
  - Ensure SPA fallback allows `/consent` route to be served by React.

- [x] **Item 2: Create React Consent Page & API Integration**
  - Path: `src/OpenSaur.CoreGate.Web/Frontend/src/pages/ConsentPage.tsx`, `api/auth.ts`, `dtos/`
  - Implement `ConsentPage` using `PageLayout`, `Card`, Material UI buttons, icons, and scope checklist.
  - Wire up Accept & Reject actions to `/api/consent` and redirect to the returned URL.

- [x] **Item 3: Register `/consent` Route in React Router and Verify Frontend Build**
  - Path: `src/OpenSaur.CoreGate.Web/Frontend/src/App.tsx`
  - Add `<Route path="/consent" element={<ConsentPage />} />`.
  - Build frontend and verify C# compilation with 0 errors.

- [x] **Item 4: Unify Scope Name and Description in Consent Details API & Frontend**
  - Path: `src/OpenSaur.CoreGate.Web/Features/Auth/Dtos/ConsentDtos.cs`, `GetConsentDetailsHandler.cs`, `Frontend/src/dtos/ConsentDtos.ts`, `Frontend/src/pages/ConsentPage.tsx`
  - In backend: return `ConsentScopeItem(string Name, string Description)` in `ConsentDetailsResponse`.
  - In frontend: consume `scope.name` and `scope.description` directly, removing hardcoded frontend dictionary.
