# OIDC Authentication Flow

## Overview
**Flow**: Authorization Code with PKCE (industry standard for SPAs).

**Components**: OIDC Provider (external IdP) → Resource Server (.NET API with OpenIddict) → Client (React SPA).

## Flow Steps

### Phase 1: Initiation
1. Client generates `code_verifier` + `code_challenge` (SHA-256).
2. Client generates random `state` (CSRF protection) and stores return path in `pkceStorage`.
3. Redirect to OIDC Provider with: `client_id`, `response_type=code`, `scope=openid profile email`, `redirect_uri`, `state`, `code_challenge`, `code_challenge_method=S256`.

### Phase 2: User Authentication
1. User authenticates with IdP (credentials, MFA, etc.).
2. Provider redirects back to `/auth/callback` with `authorization_code` + `state`.

### Phase 3: Token Exchange (Callback)
1. `AuthCallbackPage.tsx` intercepts the callback.
2. Verifies `state` matches stored value (CSRF) and retrieves `code_verifier` (PKCE).
3. Exchanges `authorization_code` + `code_verifier` for tokens.
4. Receives: **ID Token** (user info), **Access Token** (API auth), **Refresh Token** (optional).

### Phase 4: Session Init
1. `AuthContext.tsx` stores tokens in React state (not localStorage — XSS protection).
2. `setClientAccessToken` configures Axios with `Authorization: Bearer <token>`.
3. User navigated to original destination.

## Security Summary

| Threat | Mitigation |
|:---|:---|
| CSRF | `state` parameter verification |
| Code Interception | PKCE |
| Token Theft (XSS) | Tokens in React memory, not localStorage |
| Token Expiry | Background refresh via `refreshAuthSession` |

## Troubleshooting
- **"State Mismatch"**: Multiple tabs or interrupted session.
- **"Missing PKCE Session"**: Lost local state (page refresh/browser closed).
- **"Token Exchange Failed"**: Invalid `client_id`, mismatched `redirect_uri`, or expired code.
