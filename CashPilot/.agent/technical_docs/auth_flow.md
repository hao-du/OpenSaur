# Technical Documentation: OIDC Authentication Flow

This document provides a detailed, step-by-step technical overview of the OpenID Connect (OIDC) authentication flow implemented in the CashPilot application.

## 1. Overview

CashPilot uses the **OIDC Authorization Code Flow with PKCE (Proof Key for Code Exchange)**. This is the industry-standard security pattern for Single Page Applications (SPAs) to authenticate users without exposing sensitive tokens to the browser's history or unauthorized scripts.

### Core Components
- **OIDC Provider (Authority)**: An external identity provider (e.g., Microsoft Entra ID, Google, Okta) that handles user authentication and issues tokens.
- **Resource Server (Backend API)**: The .NET Web API (CashPilot) which validates the incoming JWT `access_token` using `OpenIddict`.
- **Client (Frontend SPA)**: The React application that initiates the login, handles the callback, and manages the session.

---

## 2. Step-by-Step Authentication Flow

### Phase 1: Initiation (Pre-Redirect)
Before the user is sent to the provider, the frontend must prepare for a secure handshake.

1.  **PKCE Generation**: The client generates a high-entropy `code_verifier` (a random string) and derives a `code_challenge` from it using SHA-256 hashing.
2.  **State & Return Path**: The client generates a unique, random `state` string (to prevent Cross-Site Request Forgery - CSRF) and stores the user's intended destination (e.g., `/dashboard`) in local storage (`pkceStorage`).
3.  **Redirection**: The user is redirected to the OIDC Provider's authorization endpoint with the following parameters:
    - `client_id`: The application's identity.
    - `response_type`: `code`.
    - `scope`: Usually `openid profile email`.
    - `redirect_uri`: The URL where the provider should send the user after login (e.g., `https://app.cashpilot.com/auth/callback`).
    - `state`: The random string generated in step 2.
    - `code_challenge`: The hashed version of the `code_verifier`.
    - `code_challenge_method`: `S256`.

### Phase 2: User Authentication
1.  **Identity Provider Interaction**: The user interacts directly with the OIDC Provider (not the CashPilot app). They enter their credentials, perform MFA, etc.
2.  **Redirection with Code**: Once authenticated, the provider redirects the user back to the application's `redirect_uri` (the `/auth/callback` route) with a temporary `authorization_code` and the `state` in the query parameters.

### Phase 3: The Token Exchange (The "Callback" Phase)
This is the most critical security step where the identity is verified.

1.  **Callback Interception**: `AuthCallbackPage.tsx` intercepts the request.
2.  **Security Checks**:
    - **State Verification**: It compares the `state` in the URL with the `state` stored in `pkceStorage`. If they don't match, the request is rejected (CSRF protection).
    - **PKCE Verification**: It retrieves the original `code_verifier` from storage.
3.  **The Exchange Request**: The client sends a request to the backend (or the provider) to exchange the `authorization_code` for actual tokens. It must include the `code_verifier`.
    - *The Provider verifies the `code_verifier` by hashing it. If the hash matches the `code_challenge` sent in Phase 1, it proves the client requesting the token is the same one that initiated the flow.*
4.  **Token Receipt**: The exchange returns a bundle containing:
    - **ID Token**: A JWT containing user identity information (name, email, etc.).
    - **Access Token**: A JWT used to authorize subsequent API calls.
    - **Refresh Token** (Optional): Used to obtain new tokens without re-prompting the user.

### Phase 4: Session Initialization (Frontend)
1.  **Context Update**: `AuthContext.tsx` receives the tokens and updates the `AuthSessionContext`.
2.  **Global State**: The `accessToken` is stored in memory (within the React state) and the `idToken` is kept for user info.
3.  **API Configuration**: The `setClientAccessToken` function is called, which configures the global HTTP client (Axios/Fetch) to include the `Authorization: Bearer <token>` header in every outgoing API request.
4.  **Navigation**: The user is finally navigated to their original destination (e.g., `/dashboard`).

---

## 3. Token Management & Security

### Token Storage
- **Access Tokens**: Stored in the React component state (`AuthSessionContext`). This is highly secure as it is not accessible to malicious scripts via `localStorage`.
- **Refresh Tokens**: Handled by the `refreshAuthSession` logic. When an access token is nearing expiry, the application automatically performs a "silent" refresh in the background using the refresh token.

### Security Summary
| Threat | Mitigation |
| :--- | :--- |
| **CSRF (Cross-Site Request Forgery)** | Use of the `state` parameter and verification during callback. |
| **Code Interception (Auth Code Injection)** | **PKCE (Proof Key for Code Exchange)** ensures only the client that started the flow can finish it. |
| **Token Theft (XSS)** | Access tokens are kept in memory (React state), not in `localStorage` or `sessionStorage`. |
| **Token Expiry** | Automated background refresh using the `refreshAuthSession` mechanism. |

---

## 4. Troubleshooting

- **"State Mismatch" Error**: This usually occurs if the user has multiple tabs open or if the user's session was interrupted. It prevents CSRF attacks.
- **"Missing PKCE Session" Error**: The client lost its local state (e.g., page refresh or browser closed) before the callback arrived.
- **"Token Exchange Failed"**: Typically indicates an invalid `client_id`, a mismatch in `redirect_uri`, or an expired `authorization_code`.
