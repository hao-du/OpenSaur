# Feature 006: Rename BFF Endpoints and Mask Cookie Name

## Description
Remove and disguise all public "bff" naming across backend endpoints and frontend hooks. Replace `/bff/login` and `/bff/logout` with `/auth/login` and `/auth/logout`. Change the session cookie name to `cashpilot-s`. Refactor backend namespaces and classes from `Features/Bff` to `Features/Auth`.

---

## Tasks

### Item 1: Backend Session Cookie & Endpoints Refactor
- [x] Rename folder `src/OpenSaur.CashPilot.Web/Features/Bff` to `src/OpenSaur.CashPilot.Web/Features/Auth`.
- [x] Rename routes from `/bff/login` and `/bff/logout` to `/auth/login` and `/auth/logout` (`MapAuthEndpoints`).
- [x] Update cookie name from `__Host-cashpilot-bff` to `cashpilot-s` in `Program.cs`.
- [x] Update authentication scheme constants and lock prefixes to avoid "bff" keyword.

### Item 2: Frontend & Vite Configuration Update
- [x] Update `client/src/features/auth/hooks/useAuth.ts` to navigate to `/auth/login` and `/auth/logout`.
- [x] Update proxy configuration in `client/vite.config.ts` from `/bff` to `/auth`.
- [x] Rebuild client via `npm run build` and verify `dotnet build` succeeds.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.

