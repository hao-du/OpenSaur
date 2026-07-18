# OpenSaur

OpenSaur is a .NET 10 platform made up of an identity provider, an identity administration app, a personal finance app, a CMS, and an edge gateway. The web applications use PostgreSQL, OpenID Connect, and React where a custom frontend is required.

```text
Browser -> Gateway -> CoreGate (sign-in and token issuing)
                   -> Zentry (identity administration)
                   -> CashPilot (personal finance)
                   -> Umbraco (content management)
```

## Applications

| Path | Application | Purpose | Local URL |
| --- | --- | --- | --- |
| `CoreGate/` | CoreGate | Central identity provider built with ASP.NET Core Identity and OpenIddict. It owns login, logout, authorization, token, and user-info flows. | `https://localhost:5001` |
| `Zentry/` | Zentry | React and .NET administration app for users, roles, permissions, workspaces, settings, and OIDC clients. It manages the identity data consumed by CoreGate. | `https://localhost:5011` |
| `CashPilot/` | CashPilot | React and .NET personal finance app for accounts, transactions, transfers, currencies, tags, reports, templates, and offline/pending transaction workflows. | `https://localhost:5031` |
| `Umbraco/` | OpenSaur Umbraco | Umbraco CMS with CoreGate single sign-on and workspace-based backoffice provisioning. | `https://localhost:5021/umbraco` |
| `Gateway/` | Gateway | YARP edge proxy with host-based forwarding, rate limiting, and a circuit breaker for the four web apps. | `http://localhost:5230` |

Supporting folders:

- `Common/OpenSaur.Common/` is the shared .NET library. It is currently a minimal project.
- `Common/OpenSaur.CashPilot/` is a tracked older/reference CashPilot tree, not the active CashPilot application.
- `Infrastructure/` contains Azure scheduler pipeline definitions.
- Each application keeps its solution under `<App>/src/*.slnx` and deployment assets under `<App>/devops/`.

## Prerequisites

- .NET 10 SDK
- Node.js and npm (for CoreGate, Zentry, and CashPilot frontends)
- PostgreSQL
- Redis for CashPilot's distributed cache
- Optional: Docker Desktop for running PostgreSQL and Redis locally

Trust the ASP.NET Core development certificate and restore the repository-local EF tool:

```powershell
dotnet dev-certs https --trust
dotnet tool restore
```

## Secure Configuration

Do not place passwords, client secrets, API keys, or certificate passwords in tracked `appsettings*.json` files. Use environment variables, .NET user secrets, or the deployment secret store. ASP.NET Core configuration keys use double underscores in environment variables.

The main local settings are:

| Application | Required settings |
| --- | --- |
| CoreGate | `ConnectionStrings__IdentityDb`; optional OIDC certificate and Turnstile settings |
| Zentry | `ConnectionStrings__ZentryDb` (normally the same identity database used by CoreGate) |
| CashPilot | `ConnectionStrings__CashPilotDb`, `ConnectionStrings__Redis`; optional `AutoTagging__ApiKey` |
| Umbraco | `ConnectionStrings__umbracoDbDSN`, `Oidc__ClientSecret`; optional Azure Blob settings |
| Gateway | Reverse-proxy destination addresses and host mappings when running the complete stack locally |

Example for a temporary PowerShell session (replace every placeholder locally):

```powershell
$env:ConnectionStrings__IdentityDb = '<identity-postgres-connection-string>'
$env:ConnectionStrings__ZentryDb = $env:ConnectionStrings__IdentityDb
$env:ConnectionStrings__CashPilotDb = '<cashpilot-postgres-connection-string>'
$env:ConnectionStrings__Redis = 'localhost:6379'
$env:ConnectionStrings__umbracoDbDSN = '<umbraco-postgres-connection-string>'
$env:Oidc__ClientSecret = '<umbraco-oidc-client-secret>'
```

CoreGate uses ephemeral signing and encryption keys when certificate paths are not configured, which is suitable only for local development.

## Database Setup

Create separate PostgreSQL databases for CashPilot and Umbraco. CoreGate and Zentry are designed around a shared identity/OpenIddict store.

Apply CashPilot migrations after setting `ConnectionStrings__CashPilotDb`:

```powershell
dotnet ef database update --project CashPilot/src/OpenSaur.CashPilot.Web/OpenSaur.CashPilot.Web.csproj
```

The CoreGate and Zentry projects currently contain separate initial migrations that overlap on the same identity tables. Do not apply both initial migrations blindly to one empty database. Use the established identity database/deployment baseline, or reconcile a fresh baseline before local initialization. CoreGate also expects OIDC clients and identity data to already exist; there is intentionally no startup seeder.

At minimum, provision OIDC clients matching the checked-in local configuration:

- `zentry` with callback `https://localhost:5011/auth/callback`
- `cashpilot` with callback `https://localhost:5031/auth/callback`
- `umbraco-web` with the Umbraco sign-in and sign-out callbacks

Umbraco manages its own schema during its normal startup/upgrade flow.

## Restore and Build

Run from `D:\OpenSaur`:

```powershell
dotnet restore CoreGate/src/OpenSaur.CoreGate.slnx
dotnet restore Zentry/src/OpenSaur.Zentry.slnx
dotnet restore CashPilot/src/OpenSaur.CashPilot.slnx
dotnet restore Umbraco/src/OpenSaur.Umbraco.slnx
dotnet restore Gateway/src/OpenSaur.Gateway.slnx

npm --prefix CoreGate/src/OpenSaur.CoreGate.Web/Frontend ci
npm --prefix CoreGate/src/OpenSaur.CoreGate.Web/Frontend run build-dev
npm --prefix Zentry/src/OpenSaur.Zentry.Web/client ci
npm --prefix Zentry/src/OpenSaur.Zentry.Web/client run build-dev
npm --prefix CashPilot/src/OpenSaur.CashPilot.Web/client ci
npm --prefix CashPilot/src/OpenSaur.CashPilot.Web/client run build-dev
```

The frontend builds write directly to each application's `wwwroot` folder.

## Run Locally

Start the applications in dependency order, using a separate terminal for each command:

```powershell
dotnet run --project CoreGate/src/OpenSaur.CoreGate.Web/OpenSaur.CoreGate.Web.csproj --launch-profile https
dotnet run --project Zentry/src/OpenSaur.Zentry.Web/OpenSaur.Zentry.Web.csproj --launch-profile https
dotnet run --project CashPilot/src/OpenSaur.CashPilot.Web/OpenSaur.CashPilot.Web.csproj --launch-profile https
dotnet run --project Umbraco/src/OpenSaur.Umbraco.Web/OpenSaur.Umbraco.Web.csproj --launch-profile Umbraco.Web.UI
```

For ordinary local development, use the direct URLs in the application table. Gateway's checked-in development configuration targets deployed upstreams and production-style host names. To test the whole stack through Gateway, override its cluster destinations with the local HTTPS URLs and map distinct local host names to `127.0.0.1`, then run:

```powershell
dotnet run --project Gateway/src/OpenSaur.Gateway/OpenSaur.Gateway.csproj --launch-profile http
```

## Recommended Startup Order

1. PostgreSQL and Redis
2. CoreGate
3. Zentry, then provision or verify users, roles, permissions, workspaces, and OIDC clients
4. CashPilot and/or Umbraco
5. Gateway, only when host-based end-to-end routing is needed

After local work, remove temporary secrets from the shell with `Remove-Item Env:<variable-name>` or close the terminal session. Rotate any credential that has ever been committed to Git; deleting Git history does not invalidate the credential itself.
