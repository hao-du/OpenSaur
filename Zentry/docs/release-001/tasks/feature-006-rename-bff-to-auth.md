# Feature 006: Rename BFF Endpoints and Mask Cookie Name

## Description
Remove and disguise all public "bff" naming across backend endpoints and frontend hooks. Replace `/bff/login` and `/bff/logout` with `/auth/login` and `/auth/logout`. Change the session cookie name to `zentry-s`. Refactor backend namespaces and classes from `Features/Bff` to `Features/Auth`.

---

## Tasks

### Item 1: Backend Session Cookie & Endpoints Refactor
- [ ] Refactor folder `src/OpenSaur.Zentry.Web/Features/Bff` to `src/OpenSaur.Zentry.Web/Features/Auth`.
- [ ] Rename routes from `/bff/login` and `/bff/logout` to `/auth/login` and `/auth/logout` (`MapAuthEndpoints`).
- [ ] Update cookie name from `__Host-zentry-bff` to `zentry-s` in `Program.cs`.
- [ ] Update authentication scheme constants, cache keys, and lock prefixes to avoid "bff" keyword.

### Item 2: Frontend & Vite Configuration Update
- [ ] Update `client/src/features/auth/hooks/useAuth.ts` and `UserProfileMenu.tsx` to use `/auth/login` and `/auth/logout`.
- [ ] Update proxy configuration in `client/vite.config.ts` from `/bff` to `/auth`.
- [ ] Rebuild client via `npm run build` and verify `dotnet build` succeeds.

---

> [!NOTE]
> Per AGENTS.md rules: Each item above must be reviewed and approved before proceeding to another item. Checkboxes `[ ]` will only be marked `[x]` upon manual review and approval.

