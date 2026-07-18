# API Verification Rules

1. **Check typings/docs** for any external dependency before calling methods or accessing properties.
2. **Read the full file** (or relevant section) before editing to understand current logic and side-effects.
3. **Identify dependent files** that import the edited API; verify they remain compatible.
4. **Grep/scan** for affected symbols to ensure no stale references persist.
5. **Run tests/lint/type-check** immediately after editing to catch regressions.
6. Prefer dedicated hooks (e.g., `useWatch` from *react-hook-form*) over non-existent methods.
7. Keep edits small and focused; avoid unnecessary abstractions.
