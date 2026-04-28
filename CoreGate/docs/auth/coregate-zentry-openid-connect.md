# CoreGate, Zentry, and OpenID Connect

CoreGate uses ASP.NET Core Identity and OpenID Connect for different parts of the authentication flow.

ASP.NET Core Identity answers this question inside CoreGate:

```text
Who is this browser user at CoreGate?
```

OpenID Connect answers this question between applications:

```text
How does CoreGate issue tokens that Zentry can trust?
```

## CoreGate Responsibilities

CoreGate is the identity provider for the solution. It owns the interactive login flow, validates the user's username and password with ASP.NET Core Identity, and stores the local CoreGate browser session in the Identity application cookie.

The login handler signs in with the Identity application scheme:

```csharp
SignInAsync(IdentityConstants.ApplicationScheme, ...)
```

That cookie is only CoreGate's local browser session. It proves the browser is already signed in to CoreGate. Zentry should not depend on that cookie directly.

When the browser reaches `/connect/authorize`, CoreGate first checks the local Identity cookie:

```csharp
AuthenticateAsync(IdentityConstants.ApplicationScheme)
```

This lets CoreGate identify the local user before issuing any OpenID Connect response. If the Identity cookie is missing or invalid, CoreGate redirects the browser to `/login`.

After the local user is known, CoreGate builds a token principal with the current user, workspace, roles, permissions, and impersonation context. It then signs in with the OpenIddict server scheme:

```csharp
Results.SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme)
```

That is where OpenIddict takes over and produces the OpenID Connect authorization response, such as an authorization code and later access/identity tokens.

In short:

```text
ASP.NET Core Identity = CoreGate local login and browser session
OpenIddict server = OpenID Connect provider that issues tokens to clients
```

## Zentry Responsibilities

Zentry is a client and resource server that trusts tokens issued by CoreGate. Zentry should validate CoreGate-issued access tokens, not read the CoreGate Identity cookie.

For API calls, Zentry receives requests like:

```http
Authorization: Bearer <access_token>
```

Zentry validates the token's issuer, signature, audience, expiry, and claims. After validation, Zentry gets the authenticated user from the token principal.

In short:

```text
Zentry = OpenID Connect/OAuth client and resource server
CoreGate cookie = not used directly by Zentry
CoreGate token = trusted by Zentry after validation
```

## End-to-End Flow

```text
1. User opens Zentry.
2. Zentry redirects the browser to CoreGate /connect/authorize.
3. CoreGate checks the ASP.NET Core Identity application cookie.
4. If no valid cookie exists, CoreGate redirects to /login.
5. User logs in through ASP.NET Core Identity.
6. CoreGate resumes /connect/authorize.
7. CoreGate builds an OpenIddict principal from the current user state.
8. OpenIddict issues an authorization code and then tokens.
9. Zentry receives and stores the tokens according to its client flow.
10. Zentry calls APIs with the access token.
11. APIs validate the access token and use its claims.
```

## Why Login and Authorize Use Identity

It is expected that CoreGate login and authorize handlers use ASP.NET Core Identity. The authorization server must authenticate the local browser user before it can issue tokens for that user.

The important boundary is:

```text
Before token issuance: CoreGate uses its Identity cookie.
After token issuance: Zentry uses CoreGate-issued tokens.
```

OpenID Connect is the bridge between the local CoreGate login session and the tokens Zentry can trust.
