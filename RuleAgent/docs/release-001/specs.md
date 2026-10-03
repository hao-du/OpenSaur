# Release 001 — Specifications

## 1. Release Objective
Build the foundation of **RuleAgent** — a centralized workspace and project document store accessible via MCP (Model Context Protocol) and a modern Angular Web UI. It replaces fragmented local markdown files with a versioned, shared, and permission-controlled knowledge base.

---

## 2. Architecture & Pattern
- **Pattern**: **Feature Slice Architecture (Vertical Slices) + Domain-Driven Design (DDD)** following CashPilot conventions (`Domain/`, `Features/<SliceName>/`, `Infrastructure/`).
- **Domain Aggregates**: Rich domain entities implementing `IAggregateRoot` with encapsulated state-changing methods and strongly typed enums (`NodeType`, `ProjectPermissionType`, `SnapshotStatus`).
- **Endpoint/Handler Separation**: Minimal API endpoints (`*Endpoints.cs`) map HTTP inputs, validate DTOs, and extract identity claims into strongly-typed `CurrentUserContext` via `IClaimService`. Pure handlers (`*Handler.cs`) execute business logic without any direct dependency on `HttpContext` or `ClaimsPrincipal`.

---

## 3. Tech Stack
- **Backend API**: ASP.NET Core 10 Minimal API
- **Authentication**: Zentry as single Authorization Server; OpenID Connect for Web UI; OpenIddict token validation for API and MCP; Project permissions checked via `ProjectUserPermission`
- **ORM & DB**: Entity Framework Core 10, PostgreSQL (`Npgsql`)
- **Message Broker**: Apache Kafka (Aiven) via `Confluent.Kafka`
- **MCP Server**: C# MCP SDK over SSE/HTTP authenticated via Zentry bearer tokens
- **Web UI Framework**: Angular 19+ (Standalone Components)
- **UI Components**: **[Angular Material (`@angular/material`)](https://material.angular.dev/)** with Angular CDK (Tree, Dialogs, Menus, Sidenav Drawers)
- **UI Design System**: CashPilot-aligned clean styling (Brand `#00ccff`, background `#edf3f8`, `"Be Vietnam Pro"` font, clean cards, List pages, and Edit drawers)
- **State & Data Fetching**: **Native Angular 19 Signals + `HttpClient`** (100% stable, zero external state library)
- **Editor & Side-by-Side Diff**: **Monaco Editor** (`ngx-monaco-editor-v2` / `monaco-editor`)
- **Markdown Preview**: **`ngx-markdown`** (HTML preview with GFM, syntax highlighting, Mermaid diagrams)

---

## 4. Scope & Features in Release 001
- **Feature 001**: Foundation, Auth (OIDC/OpenIddict against Zentry), Data Entities & Zentry Kafka Sync.
- **Feature 002**: Folder & File Management using Closure Table (`Features/Nodes/`).
- **Feature 003**: Live Node Content & Permanent NodeSnapshot History/Diffing (`Features/Snapshots/`).
- **Feature 004**: Instruction Templates unified via Node with `SuperAdministrator` role gating (`Features/Templates/`).
- **Feature 005**: Workspace-Level Global Rules & Skills (`Features/GlobalRules/`).
- **Feature 006**: MCP Server with SSE/HTTP transport authenticated via Zentry bearer tokens (`Features/Mcp/`).
- **Feature 007**: Angular Web UI (Workspace/Project explorer, Markdown editor, Diff viewer, Approvals).

---

## 5. Data Model Summary (DDD & Enums)
All domain entities inherit from `EntityBase` (`Id`, `Description`, `IsActive`, `CreatedBy`, `CreatedOn`, `UpdatedBy`, `UpdatedOn`):
1. **`Workspace`**: Aggregate Root (`IAggregateRoot`). Synchronized from Zentry (`Id` = Zentry WorkspaceId, `Name`, `IsActive`).
2. **`User`**: Aggregate Root (`IAggregateRoot`). Synchronized from Zentry (`Id` = Zentry UserId, `WorkspaceId`, `Email`, `UserName`, `FirstName`, `LastName`, `UserSettings`, `Roles`, `Permissions`, `IsActive`).
3. **`Project`**: Aggregate Root (`IAggregateRoot`). Belongs to Workspace, has `CreatorId` (top admin), and `InstructionTemplateNodeId`.
4. **`ProjectUserPermission`**: Assigns users to projects with `Permission` of type `ProjectPermissionType` (`CanView = 1`, `CanEdit = 2`).
5. **`Node`**: Aggregate Root (`IAggregateRoot`). Folders, files, and templates (`WorkspaceId`, `ProjectId` nullable, `Type`: `NodeType` enum (`Folder = 1`, `File = 2`, `Template = 3`), `Content`: text). Encapsulates domain methods `UpdateContent`, `Rename`, `CreateSnapshot`.
6. **`NodeClosure`**: Pure hierarchy join table (`AncestorId`, `DescendantId`, `Depth`).
7. **`NodeSnapshot`**: Permanent baseline snapshots (`NodeId`, `SnapshotContent`, `Status`: `SnapshotStatus` enum (`Working = 1`, `Approved = 2`)). Encapsulates `Approve` method.

---

## 6. Security & Access Rules
- **Creator (Top Admin)**: Only user who can grant, modify, or revoke permissions for other project members.
- **`CanEdit`**: Can create, update, move, delete folders/files, and take or approve snapshots.
- **`CanView`**: Read-only across both the Angular Web UI and Coding Agent MCP tools.
- **`SuperAdministrator`**: Only users with the `SuperAdministrator` role can create, update, or delete instruction templates.
- **MCP Server Authentication**: Authenticates via Zentry bearer token and checks `ProjectUserPermission` for the specified `X-Project-Id`.
