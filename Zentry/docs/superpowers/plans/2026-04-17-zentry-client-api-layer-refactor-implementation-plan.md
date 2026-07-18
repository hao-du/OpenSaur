# Zentry Client API Layer Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Zentry SPA auth flow to use a shared Axios-based API layer for token exchange and user info calls instead of raw browser `fetch`.

**Architecture:** Add a small client API foundation under `client/src/api/` with Axios setup, shared error normalization, and focused OIDC request modules. Keep `authService.ts` as the auth orchestrator while moving HTTP concerns into the new API layer so future client APIs can follow the same pattern.

**Tech Stack:** React 19, TypeScript, Vite, Axios, React Router, existing Zentry SPA OIDC modules

---

## File Structure

### Create

- `src/OpenSaur.Zentry.Web/client/src/api/httpClient.ts`
  Creates the shared Axios instance used by client-side API modules.
- `src/OpenSaur.Zentry.Web/client/src/api/apiErrors.ts`
  Converts Axios failures into stable app-readable `Error` instances.
- `src/OpenSaur.Zentry.Web/client/src/api/oidcApi.ts`
  Handles the OIDC token exchange request through Axios.

### Modify

- `src/OpenSaur.Zentry.Web/client/package.json`
  Adds `axios`.
- `src/OpenSaur.Zentry.Web/client/src/api/userInfo.ts`
  Moves user info loading onto Axios and shared error handling.
- `src/OpenSaur.Zentry.Web/client/src/auth/authService.ts`
  Stops using raw HTTP and delegates token exchange to `oidcApi.ts`.

### Verification Targets

- `src/OpenSaur.Zentry.Web/client`
- `src/OpenSaur.Zentry.slnx`

## Task 1: Add Axios And Shared API Utilities

**Files:**
- Modify: `src/OpenSaur.Zentry.Web/client/package.json`
- Create: `src/OpenSaur.Zentry.Web/client/src/api/httpClient.ts`
- Create: `src/OpenSaur.Zentry.Web/client/src/api/apiErrors.ts`

- [ ] **Step 1: Add Axios to the client dependencies**

Update `src/OpenSaur.Zentry.Web/client/package.json`:

```json
{
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "@mui/icons-material": "^7.3.4",
    "@mui/material": "^7.3.4",
    "axios": "^1.9.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.9.4"
  }
}
```

- [ ] **Step 2: Install the dependency**

Run: `npm install`
Workdir: `src/OpenSaur.Zentry.Web/client`
Expected: `package-lock.json` updates and install completes without errors.

- [ ] **Step 3: Create the shared Axios client helper**

Create `src/OpenSaur.Zentry.Web/client/src/api/httpClient.ts`:

```ts
import axios from "axios";

export const httpClient = axios.create({
  timeout: 15000
});
```

- [ ] **Step 4: Create shared API error normalization**

Create `src/OpenSaur.Zentry.Web/client/src/api/apiErrors.ts`:

```ts
import axios from "axios";

export function createApiError(error: unknown, defaultMessage: string) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (typeof status === "number") {
      return new Error(`${defaultMessage} with status ${status}.`);
    }

    return new Error(defaultMessage);
  }

  if (error instanceof Error && error.message.length > 0) {
    return error;
  }

  return new Error(defaultMessage);
}
```

- [ ] **Step 5: Verify the client still builds after the dependency and utility setup**

Run: `npm run build`
Workdir: `src/OpenSaur.Zentry.Web/client`
Expected: Build succeeds with Axios added and the new API utility files present.

## Task 2: Move OIDC Token Exchange Into The API Layer

**Files:**
- Create: `src/OpenSaur.Zentry.Web/client/src/api/oidcApi.ts`
- Modify: `src/OpenSaur.Zentry.Web/client/src/auth/authService.ts`

- [ ] **Step 1: Add an Axios-backed OIDC API module**

Create `src/OpenSaur.Zentry.Web/client/src/api/oidcApi.ts`:

```ts
import { buildTokenEndpointUrl, buildTokenRequestBody } from "../auth/oidcClient";
import type { AppRuntimeConfig, PendingAuthRequest } from "../auth/authTypes";
import { createApiError } from "./apiErrors";
import { httpClient } from "./httpClient";

export async function exchangeAuthorizationCode(
  config: AppRuntimeConfig,
  code: string,
  pendingRequest: PendingAuthRequest
) {
  try {
    const response = await httpClient.post<Record<string, unknown>>(
      buildTokenEndpointUrl(config),
      buildTokenRequestBody(config, code, pendingRequest),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    return response.data;
  } catch (error) {
    throw createApiError(error, "Token exchange failed");
  }
}
```

- [ ] **Step 2: Remove raw token HTTP from the auth orchestrator**

Update `src/OpenSaur.Zentry.Web/client/src/auth/authService.ts` imports:

```ts
import { exchangeAuthorizationCode } from "../api/oidcApi";
import { fetchUserInfo } from "../api/userInfo";
```

Remove these imports from `authService.ts`:

```ts
  buildTokenEndpointUrl,
  buildTokenRequestBody
```

- [ ] **Step 3: Replace the token exchange fetch call**

Update the token exchange block in `src/OpenSaur.Zentry.Web/client/src/auth/authService.ts`:

```ts
  let payload: Record<string, unknown>;

  try {
    payload = await exchangeAuthorizationCode(config, code, pendingRequest);
  } catch (error) {
    clearPendingAuthRequest();
    clearAuthSession();
    throw error;
  }

  const tokenSet = buildTokenSet(payload);
```

Delete the old block:

```ts
  const tokenResponse = await fetch(buildTokenEndpointUrl(config), {
    body: buildTokenRequestBody(config, code, pendingRequest),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    method: "POST"
  });

  if (!tokenResponse.ok) {
    clearPendingAuthRequest();
    clearAuthSession();
    throw new Error(`Token exchange failed with status ${tokenResponse.status}.`);
  }

  const payload = await tokenResponse.json() as Record<string, unknown>;
```

- [ ] **Step 4: Verify token exchange refactor compiles**

Run: `npm run build`
Workdir: `src/OpenSaur.Zentry.Web/client`
Expected: Build succeeds and `authService.ts` no longer uses `fetch` for token exchange.

## Task 3: Move User Info To The Shared Axios Layer

**Files:**
- Modify: `src/OpenSaur.Zentry.Web/client/src/api/userInfo.ts`

- [ ] **Step 1: Replace fetch with Axios in the user info module**

Update `src/OpenSaur.Zentry.Web/client/src/api/userInfo.ts`:

```ts
import { buildUserInfoEndpointUrl } from "../auth/oidcClient";
import type { AppRuntimeConfig, UserProfile } from "../auth/authTypes";
import { createApiError } from "./apiErrors";
import { httpClient } from "./httpClient";

export async function fetchUserInfo(config: AppRuntimeConfig, accessToken: string): Promise<UserProfile> {
  try {
    const response = await httpClient.get<Record<string, unknown>>(buildUserInfoEndpointUrl(config), {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const payload = response.data;
    return {
      email: readString(payload.email),
      preferredUsername: readString(payload.preferred_username),
      roles: readStringArray(payload.role),
      subject: readString(payload.sub) ?? "unknown",
      workspaceId: readString(payload.workspace_id)
    };
  } catch (error) {
    throw createApiError(error, "User info request failed");
  }
}
```

Keep the existing `readString` and `readStringArray` helpers unchanged.

- [ ] **Step 2: Verify there are no remaining fetch calls in the client auth flow**

Run: `rg "fetch\\(" src/OpenSaur.Zentry.Web/client/src`
Workdir: `C:\Code\New folder\OpenSaur\Zentry`
Expected: No matches under the current auth/API flow files.

- [ ] **Step 3: Verify the client build after the API-layer refactor**

Run: `npm run build`
Workdir: `src/OpenSaur.Zentry.Web/client`
Expected: Build succeeds with the Axios-backed user info call.

## Task 4: Full Verification

**Files:**
- No code changes required unless verification exposes a defect.

- [ ] **Step 1: Build the Zentry solution**

Run: `dotnet build src/OpenSaur.Zentry.slnx`
Workdir: `C:\Code\New folder\OpenSaur\Zentry`
Expected: Solution builds successfully.

- [ ] **Step 2: Run the Zentry host**

Run: `dotnet run --project src/OpenSaur.Zentry.Web`
Workdir: `C:\Code\New folder\OpenSaur\Zentry`
Expected: App starts on the configured development URLs.

- [ ] **Step 3: Manually verify login flow**

Check in a browser:

```text
1. Open Zentry while signed out and confirm redirect to CoreGate still begins.
2. Complete login and confirm callback processing succeeds.
3. Confirm the protected dashboard still loads profile data.
4. Confirm logout still clears local auth state and returns through the existing flow.
```

Expected: Auth flow behavior remains unchanged from a user perspective except for the internal HTTP implementation.

## Self-Review

- Spec coverage check:
  - Axios added: Task 1
  - shared API layer created: Tasks 1-3
  - token exchange moved out of auth orchestration: Task 2
  - user info moved onto shared API layer: Task 3
  - build/manual verification preserved: Task 4
- Placeholder scan:
  - no `TODO`, `TBD`, or unresolved placeholders remain
- Type consistency:
  - `httpClient`, `createApiError`, `exchangeAuthorizationCode`, and `fetchUserInfo` are named consistently across the plan
