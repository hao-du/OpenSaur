## 1. Frontend Foundation

- [x] 1.1 Create the React + Vite frontend under `src/OpenSaur.Identity.Web/client` with the agreed package dependencies and feature-first folder structure.
- [x] 1.2 Add ASP.NET Core host integration for Vite development and built-asset serving so `/api/*` stays backend traffic and non-API routes serve the frontend.
- [x] 1.3 Add shared frontend providers for routing, TanStack Query, theme/layout setup, and auth bootstrap entry points.

## 2. Auth Infrastructure

- [x] 2.1 Implement the shared axios client and auth state infrastructure that keeps the access token in memory only and uses the backend-managed refresh cookie flow.
- [ ] 2.2 Implement first-party authorization callback completion, `/api/auth/me` bootstrap, and redirect-back handling for protected routes.
- [ ] 2.3 Implement proactive refresh-before-expiry and expired-session fallback to `/login?returnUrl=...`.

## 3. Auth UI

- [ ] 3.1 Build the atomic-design auth UI layers using React Hook Form, Lucide icons, and MUI `Divider`.
- [ ] 3.2 Implement the `/login` page and form flow that posts credentials to `/api/auth/login` and resumes the first-party authorization flow.
- [ ] 3.3 Implement the `/auth/callback` route that finalizes auth state and redirects to the preserved route.
- [ ] 3.4 Implement the `/change-password` page and the forced password-change redirect behavior.
- [ ] 3.5 Implement one protected shell route with responsive mobile, tablet, and desktop layouts plus logout support.

## 4. Verification

- [ ] 4.1 Add frontend tests for auth state, callback handling, refresh orchestration, and guarded-route redirects.
- [ ] 4.2 Add end-to-end coverage for login success, redirect-back, forced password change, refresh-before-expiry, logout, and expired-token fallback.
- [ ] 4.3 Document the FE development and same-host deployment workflow for the new client app.
