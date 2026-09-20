# Project Architecture and Understanding

## 1. Project Overview

**OpenSaur Zentry** is a modern centralized Identity & Access Management (IAM) and multi-tenant workspace administration portal built on .NET 10 and React 19 (TypeScript + Vite + MUI).
It acts as the administration console and identity hub for applications within the OpenSaur ecosystem, leveraging OpenID Connect (OIDC) protocols with [OpenIddict](https://github.com/openiddict/openiddict-core) and PostgreSQL.

---

## 2. Architecture & Technology Stack

### 2.1 Backend (.NET 10 Web API)
- **Framework**: ASP.NET Core (.NET 10, C# 13/14 nullable enabled)
- **Database & ORM**: PostgreSQL with Entity Framework Core 10 (`Npgsql.EntityFrameworkCore.PostgreSQL`)
- **Identity & Security**:
  - ASP.NET Core Identity (`IdentityDbContext`) configured with `Guid` keys and custom user/role extensions.
  - OpenIddict 7.3.0 for OAuth2 / OIDC token validation (`OpenIddict.Validation.AspNetCore`, `OpenIddict.EntityFrameworkCore`).
- **Validation**: FluentValidation 12.1.0 with endpoint-level dependency injection and handler validation.
- **Pattern / Design**: Vertical Slice Architecture (Feature-sliced minimal endpoints, command/query handlers, request/response records).
- **Audit & Base Entity**: `EntityBase` / `IEntityBase` automatically assigns UUID v7 (`Guid.CreateVersion7()`) and UTC timestamps (`CreatedOn`, `UpdatedOn`) on EF Core `SaveChanges()`.

### 2.2 Frontend (React 19 SPA)
- **Runtime / Bundler**: React 19, TypeScript, Vite, bundled into `wwwroot` for single-host hosting by ASP.NET Core.
- **Component UI**: Material UI (MUI v7), Emotion, Lucide React icons.
- **State & Data Fetching**: TanStack React Query v5 with Axios.
- **Routing**: React Router DOM v7.
- **Authentication**: OIDC Authorization Code Flow with PKCE (`AuthSessionContext`, silent iframe token refresh before expiry, logout redirection).
- **Runtime Configuration**: Dynamic configuration served via `/app-config.js` (`window.__ZENTRY_CONFIG__`) so the client artifact is environment-agnostic without rebuilding JS files across environments.

### 2.3 DevOps & Containerization
- **Containerization**: `Dockerfile.artifact` targeting `mcr.microsoft.com/dotnet/aspnet:10.0` running as non-root `$APP_UID` on port 8080.
- **CI/CD**: Azure DevOps multi-stage pipelines:
  1. `azure-pipelines.build-test-artifact.yml`: Build React client, build/publish .NET 10 project to artifact.
  2. `azure-pipelines.artifact-to-dockerhub.yml`: Docker build and push to Docker Hub (`duchihao/zentry`).
  3. `azure-pipelines.dockerhub-to-aca.yml`: Automatic deployment / revision update to Azure Container Apps (ACA) in resource group `Home`.

---

## 3. Core Business Concepts & Domain Model

### 3.1 Tenancy & Workspaces
- **Workspace (`Workspace`)**: Represents an isolated tenant or organization boundary.
  - Supports quota limiting (`MaxActiveUsers`).
  - Contains users and allowed roles (`WorkspaceRole`).
  - Includes user impersonation support by Super Administrators.

### 3.2 Identity & Role-Based Access Control (RBAC)
- **User (`ApplicationUser`)**:
  - Belongs to a specific `WorkspaceId`.
  - Holds personal details (`FirstName`, `LastName`), active status (`IsActive`), and password policy flag (`RequirePasswordChange`).
  - Supports per-user preferences saved as JSON (`UserSettings`, e.g., language, timezone).
- **Role (`ApplicationRole`)**:
  - Global or workspace-assigned role.
  - Special role: `SUPER ADMINISTRATOR` (`Constants.NormalizedSuperAdministrator`).
- **Permission & Scope (`PermissionScope`, `Permission`, `RolePermission`)**:
  - Granular permissions mapped under functional scopes (e.g. `Administrator.CanManage`).
  - Mapped to roles via `RolePermission`.

### 3.3 OpenID Connect Management
- **OIDC Clients (`OpenIddictApplicationDescriptor`)**:
  - Super Administrators can register, modify, and delete OIDC client apps.
  - Configures client credentials/public clients, PKCE, allowed scopes, redirect URIs, and post-logout URIs.

### 3.4 Outbox Pattern
- **Outbox Message (`OutboxMessage`)**:
  - Prepares the system for reliable event-driven integration with external services/microservices (recording `EventName`, `AggregateType`, `Payload`, `Status`, `Retries`, `OccurredOn`, and `ProcessedOn`).

---

## 4. Security & Authorization Architecture

### 4.1 Policies
1. **`SuperAdminOnly`**: Requires an authenticated user who possesses the `SUPER ADMINISTRATOR` role (and is not currently impersonating a normal tenant user).
2. **`AdminCanManagePolicyName`**: Requires the `Administrator.CanManage` permission claim.
3. **`AdminCanManageOrSuperAdminPolicyName`**: Requires either `Administrator.CanManage` or Super Administrator privileges.

### 4.2 Impersonation System
- Allows a Super Administrator to view or troubleshoot a workspace as one of its users.
- Issues tokens carrying the claim `impersonation_original_user_id`.
- While impersonating, Super Admin privileges are dropped (`ClaimHelper.IsSuperAdministrator(user)` returns `false`) to ensure safety and tenant isolation during session inspection.

---

## 5. Functional Features & Endpoints

| Feature | Base Endpoint | Permissions / Policy | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **OIDC Clients** | `/api/oidc-client` | `SuperAdminOnly` | List, get details, create, edit, delete OAuth2/OIDC clients with redirect URIs and scopes. |
| **Workspaces** | `/api/workspace` | `SuperAdminOnly` | List workspaces, view quota/usage, create/edit workspaces, assign roles to workspaces, fetch eligible impersonation targets. |
| **Users** | `/api/user` | `AdminCanManage` | Search/filter workspace users, create user, edit user details, trigger password reset, inspect and assign roles. |
| **Roles** | `/api/role` | `AdminCanManageOrSuperAdmin` / `SuperAdminOnly` (writes) | List roles, view role permissions, assign users to roles. Role creation/edit restricted to Super Admin. |
| **Permissions** | `/api/permission` | `SuperAdminOnly` | Query available scopes and permissions list. |
| **Dashboard** | `/api/dashboard` | Authenticated | View global metrics for Super Admin (total workspaces, active tenants, global users) or workspace metrics (active users, max quota, available roles) for tenant admin. |
| **Profile** | `/api/profile` | Authenticated | Fetch current user session profile, navigation menu permissions, impersonation state, update password flags. |
| **Settings** | `/api/settings` | Authenticated | Read and update user personal settings (language, timezone preferences). |
| **Frontend Host** | `/app-config.js` & SPA routes | Anonymous | Serves dynamic OIDC configuration script and index SPA fallback. |

---

## 6. Directory Structure & Conventions

```
Zentry/
├── AGENTS.md                              # Agent instructions, core project rules, and release cycle specs
├── devops/                                # CI/CD and deployment configurations
│   ├── azure-pipelines*.yml               # Azure DevOps build, push, and ACA release pipelines
│   └── Dockerfile.artifact                # Multi-stage production container image
├── docs/                                  # Project documentation and release task tracking
│   └── project_architecture_and_understanding.md
├── agents/                                # Skills, superpowers, memory, and AI agent instructions
└── src/
    └── OpenSaur.Zentry.Web/               # Backend Web API + Static SPA Host
        ├── Domain/                        # EF Core domain entities (Identity, Workspaces, Permissions, Outbox)
        ├── Features/                      # Vertical slice feature folders (Endpoints, Handlers, DTOs, Validators)
        ├── Infrastructure/                # DbContext, Migrations, Auth, Helpers, Hosting
        ├── client/                        # React 19 Frontend SPA (Vite + TypeScript + MUI)
        └── wwwroot/                       # Compiled production frontend assets
```

---

## 7. Developer & Agent Operational Rules (from `AGENTS.md`)
- **Skills Check**: Always consult local skills under `agents/skills/superpowers/` before planning or implementing.
- **No Tests by Default**: Do not add unit tests or automated tests unless explicitly requested.
- **No Automatic Git Commits**: Do not make git commits automatically unless instructed.
- **Clean `src/`**: Never place agent instructions, workflow notes, or documentation files in `src/`.
- **No Seeding**: Never add startup seeding or dummy data code unless explicitly requested.
- **Release Tracking**: All release tasks are organized strictly under `docs/release-xxx/tasks/feature-yyy.md` with explicit checkbox tracking.

