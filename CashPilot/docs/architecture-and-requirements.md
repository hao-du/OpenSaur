# CashPilot - Architecture & Requirements Specification

## 1. Executive Summary & Overview

**CashPilot** is a personal and multi-currency financial management platform developed by OpenSaur. It enables users to track income and expenses, monitor bank accounts/savings deposits, manage peer-to-peer loans and transfers, record currency exchanges, and categorize records using tags (with AI-powered auto-tagging).

---

## 2. Business Requirements & Functional Scope

### 2.1 Core Entities & Master Data Management
- **Currencies**:
  - Support multi-currency transactions (e.g., VND, USD, EUR).
  - Flags for default currency and active status.
- **Banks**:
  - Financial institution records (name, short name, logo/icon, status).
- **Counterparties**:
  - Individuals or organizations for peer transfers (lend, borrow, give, receive).
  - Default counterparty indicator for quick selection.
- **Tags & Markers**:
  - Custom user-defined tags with automated matching terms (`matchingTerms`).
  - **Marker Tag** and **Default Marker Tag** concept: Marker tags delineate financial periods (such as pay periods or budget cycles) for comparative income/outcome tracking.
- **Templates**:
  - Reusable transaction definitions (`CashFlow`, `Transfer`, `Exchange`, `BankAccount`) storing prefilled JSON templates for rapid single-click entry.

### 2.2 Transaction Types & Operations
CashPilot supports 4 specialized transaction types:
1. **CashFlow**:
   - Everyday income and expenses with direction (`In` / `Out`).
   - Detailed itemization via `TransactionItem` (splits with custom amounts).
   - Tagging support.
2. **BankAccount (Savings / Deposit accounts)**:
   - Initial deposit tracking, linked to a specific bank and currency.
   - Status tracking (`Active`, `Matured`, `ClosedEarly`).
   - Movement sync (`InitialDeposit`, `InterestPayment`, `PrincipalReturn`).
   - Interest rate and maturity date tracking.
3. **Transfer (P2P / Debt tracking)**:
   - Types: `Lend`, `Borrow`, `Give`, `Receive`.
   - Linked counterparty, due date, and status (`Active`, `Completed`, `Cancelled`).
4. **Exchange (Currency Exchange)**:
   - Currency swap tracking with exchange rates between two currency accounts/transactions.

### 2.3 Dashboard & Reporting
- **Multi-Currency Balances**: Aggregated wallet balance per active currency.
- **Active Bank Balances**: Aggregated balances across active bank accounts.
- **Marker Period Analysis**: Income vs. outcome comparisons grouped by marker tag periods.
- **Daily In/Out Calendar**: Visual monthly/weekly cash movement tracking with inflows and outflows per day.
- **Annual Reports**: Income and outcome trends over months/years with filtering by currency and tags.

### 2.4 AI-Powered Auto-Tagging
- Integrates with OpenRouter AI API (configurable model, e.g. `gpt-oss-20b` or custom LLMs).
- Hybrid suggestion engine:
  - Deterministic term matching based on tag definition rules.
  - LLM-based categorization fallback analyzing transaction description and transaction type.

---

## 3. System Architecture

```
+---------------------------------------------------------------+
|                      Client Layer (React 19)                  |
|  - Vite + TypeScript + Material UI (MUI v9) + Emotion         |
|  - TanStack React Query + React Hook Form + React Router v7   |
|  - Direct API communication via secure HTTP-only cookies      |
+-------------------------------+-------------------------------+
                                | HTTPS (REST API / JSON with Credentials)
                                v
+---------------------------------------------------------------+
|                 API & Host Layer (ASP.NET Core .NET 10)       |
|  - Backend-for-Frontend (BFF) Pattern                         |
|  - Cookie Authentication (__Host-cashpilot-bff, SameSite=Strict)|
|  - OpenID Connect Server-Side Code Flow & Token Refresh       |
|  - Security Headers & Request Cancellation Middleware         |
|  - Hybrid Cache (L1 MemoryCache + L2 Redis)                   |
|  - Static SPA Fallback Hosting (MapFallbackToFile)            |
+-------------------------------+-------------------------------+
                                |
        +-----------------------+-----------------------+
        v                                               v
+-------------------------------+       +-------------------------------+
|       Data Access Layer       |       |       External Services       |
|  - EF Core 10 (Npgsql)        |       |  - OIDC Authority (Auth)      |
|  - PostgreSQL Database        |       |  - OpenRouter AI (Auto-Tag)   |
|  - Version 7 UUIDs (Guid.v7)  |       |  - Redis Cache                |
+-------------------------------+       +-------------------------------+
```

### 3.1 Backend Architecture (.NET 10)
- **Framework**: ASP.NET Core Minimal APIs using .NET 10.
- **Pattern**: Feature-based Vertical Slice Architecture with BFF:
  - Each feature folder under `Features/<FeatureName>` encapsulates its own Endpoints, Handlers, DTOs, Services, and Validations.
  - Endpoints extract HTTP parameters into strongly-typed DTOs; Handlers do not depend on `HttpContext`.
- **Database & Auditing**:
  - PostgreSQL via Entity Framework Core (`Npgsql.EntityFrameworkCore.PostgreSQL`).
  - Base entity `EntityBase` and `IEntityBase` enforcing `Id` (UUIDv7 via `Guid.CreateVersion7()`), `CreatedOn`, `CreatedBy`, `UpdatedOn`, `UpdatedBy`, and `IsActive` soft-delete flags.
- **Caching**:
  - `Microsoft.Extensions.Caching.Hybrid` combining in-memory L1 cache with Redis L2 distributed cache (`HybridCacheService`).
- **Security & Authentication (BFF)**:
  - Secure, HTTP-only, `SameSite=Strict` cookie (`__Host-cashpilot-bff`).
  - Server-side OIDC challenge and code exchange with PKCE (`Microsoft.AspNetCore.Authentication.OpenIdConnect`).
  - Silent token refresh via backchannel HTTP client and cookie validation events.
  - Policy-based authorization (`AppAuthorization.CanAccessPolicyName`) verifying `CashPilot.CanManage` or super admin permissions.

### 3.2 Frontend Architecture (React 19)
- **Core Stack**: React 19, TypeScript, Vite, Material UI (MUI v9), `@emotion/react`.
- **State & Data Fetching**:
  - Server state managed through `@tanstack/react-query`.
  - Form state managed with `react-hook-form`.
  - Internationalization and theme providers (`SettingProvider`, `AppLocalizationProvider`).
- **Separation of Concerns**:
  - UI Layer (pure input/dumb components).
  - Bridge Layer (drawers and modals handling modal-level states).
  - Page/Container Layer (data fetching, mutations, and orchestration).

---

## 4. DevOps & Deployment Architecture

- **Azure DevOps CI/CD Pipeline** (`devops/azure-pipelines.yml`):
  1. `azure-pipelines.build-test-artifact.yml`: Builds .NET 10 backend and compiles Vite client.
  2. `azure-pipelines.artifact-to-dockerhub.yml`: Packages build artifacts into lightweight container image and pushes to Docker Hub (`duchihao/cashpilot`).
  3. `azure-pipelines.dockerhub-to-aca.yml`: Deploys container image to Azure Container Apps (`ca-cashpilot`).
- **Containerization**:
  - Multi-stage Dockerfile (`devops/Dockerfile.artifact`) executing under ASP.NET Core Linux runtime.
