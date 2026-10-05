# RuleAgent Architecture and Requirements

## 1. Overview & Requirements
**RuleAgent** is a centralized application that connects to Coding Agents via the Model Context Protocol (MCP). Instead of Coding Agents creating physical markdown files directly on local machines (which prevents other developers from utilizing shared rules, prompts, skills, specs, and memories), RuleAgent acts as a central repository for all agentic documentation and guidelines.

### Key Requirements
- **Centralized Markdown Guidance**: Store rules, skills, prompts, and project specs in a single shared location across all developers.
- **Closure Table Folder/File Storage**: Provide a flexible hierarchical structure where folders can store child folders, content files, and templates.
- **Live Content Storage on Node**:
  - `Node` stores the active, live markdown content directly (`Content` field).
- **Permanent NodeSnapshot History & Diff Workflow**:
  - When starting work on a feature, a **`NodeSnapshot`** is created, freezing a baseline copy of the node's content (`Status = SnapshotStatus.Working`).
  - During development, the Coding Agent or developer can update `Node.Content` multiple times without altering the baseline snapshot.
  - Diff comparisons compare the live `Node.Content` against the active `NodeSnapshot.SnapshotContent` (or any historical snapshot).
  - When the developer explicitly approves the changes, the `NodeSnapshot` is marked as **`SnapshotStatus.Approved`**.
  - All historical snapshots are **retained permanently** in `NodeSnapshot` so developers can inspect the complete timeline of changes.
- **Unified Instruction Templates via Nodes & RBAC**:
  - Instruction templates are stored directly as `Node` entities with `Type = NodeType.Template` (`ProjectId = null`).
  - **SuperAdministrator Only**: Only users with the `SuperAdministrator` role can create, update, or delete instruction templates.
  - When creating a project, developers select an instruction template node (`InstructionTemplateNodeId`).
- **Workspace-Level Global Rules & Skills**:
  - Global files, folders, and templates belong directly to the `Workspace` (`ProjectId = null`).
  - Coding Agents can directly read workspace-wide global rules, instructions, and skills alongside project-specific documentation.
- **Authentication & OpenIddict (Zentry as Single Source of Truth)**:
  - **Zentry Authorization Server**: Zentry is the single authority for user identity, client credentials, and token issuance.
  - **Web UI Login**: OpenID Connect (OIDC) Authorization Code Flow with cookie session via Zentry, matching CashPilot setup.
  - **M2M Coding Agent Authentication**: Coding Agents authenticate using OAuth2 bearer tokens issued by Zentry, supplying the target `Project-Id` on requests or per-call parameters.
  - **Token Validation**: RuleAgent uses OpenIddict validation middleware to validate all incoming bearer tokens directly against Zentry's authority.
  - **RuleAgent Authorization**: RuleAgent inspects the authenticated `UserId` from the token and enforces `CanView` vs `CanEdit` permissions via its local `ProjectUserPermission` table.
- **Workspaces & Users (Zentry Sync via Kafka on Aiven)**:
  - Workspaces and Users are synchronized from Zentry via Kafka (hosted on Aiven) asynchronously.
  - Uses direct `WorkspaceId` and `UserId` as primary keys (matching Zentry and CashPilot conventions, no `ExternalId` columns).
  - A workspace contains multiple users, and a user can belong to multiple projects.
  - Both `Workspace` and `User` include `IsActive` flags for soft-deactivation and access control.
  - `User` entity includes `UserSettings` (JSON for timezone, UI language), and `Roles` & `Permissions` (string arrays synced from Zentry for future authorization reuse).
  - Clean event-driven architecture ensures RuleAgent remains loosely coupled from Zentry.
- **Base Entity Standardization (Matching CashPilot)**:
  - All domain tables inherit standard audit and status fields (`Id`, `Description`, `IsActive`, `CreatedBy`, `CreatedOn`, `UpdatedBy`, `UpdatedOn`).
- **Project Permissions & Access Control**:
  - The project **Creator** is the top admin and the only one who can grant, update, or revoke project permissions for other users.
  - Project members are assigned either **`CanView`** (view only) or **`CanEdit`** (view and edit).
  - Users with `CanView` cannot make edits via the Web UI or via Coding Agent MCP operations (read-only enforced across both channels).
- **Web UI Management (Angular 19+)**: Modern responsive web interface for Phone, Tablet, and Desktop using Angular Material, Monaco Editor (with side-by-side diff on desktop/tablet, inline diff on phone), and Native Angular 19 Signals + `HttpClient`. Visual design (Header, Profile menu, Settings page, Side menu, List pages, and Edit drawers) follows the clean aesthetic of CashPilot using native CSS custom properties.
- **MCP Server for Coding Agents**: Official MCP C# SDK (`ModelContextProtocol.AspNetCore`) running over Streamable HTTP (`/mcp`, with SSE compatibility) exposing Tools, Resources (URI attachments), and Prompts (workflow templates), authenticated via Zentry bearer tokens and scoped by `Project-Id`.

---

## 2. System Architecture & Tech Stack

| Layer | Technology | Version / Details |
|---|---|---|
| **Architecture Pattern** | **Feature Slice Architecture + Domain-Driven Design (DDD)** | Vertical slices (`Features/<SliceName>`) with rich domain aggregate roots (`IAggregateRoot`), encapsulated state methods. Endpoint layer (`*Endpoints.cs`) extracts `CurrentUserContext` via `IClaimService`, keeping Handlers (`*Handler.cs`) completely decoupled from `HttpContext` and `ClaimsPrincipal`. |
| **Backend API** | ASP.NET Core Minimal API | **.NET 10** (Minimal API, endpoint/handler separation, strongly-typed DTOs) |
| **Authentication & OIDC** | **OpenIddict & Cookie/OIDC (Zentry Authority)** | Zentry OIDC authority as single source of truth, OpenIddict token validation, Cookie auth for Web UI |
| **Database** | PostgreSQL | Relational database with Closure Table schema |
| **ORM** | Entity Framework Core | **EF Core 10** (Npgsql) |
| **Message Broker (Sync)** | Apache Kafka (Aiven) | **Confluent.Kafka** (idiomatic background consumer syncing Users & Workspaces from Zentry) |
| **MCP Server** | **ModelContextProtocol.AspNetCore** (Official C# SDK) | Streamable HTTP (`/mcp`, SSE compatible) exposing tools for Coding Agents authenticated via Zentry bearer tokens |
| **Frontend Architecture** | **Frontend Vertical Slice Architecture + Atomic Component Wrappers** | Vertical slices (`features/<slice>/`) for all domain features. Component wrapper layer (`components/atoms/`, `components/molecules/`, `components/organisms/`) wraps all UI library components (Angular Material/CDK) so feature code has zero direct dependency on underlying UI libraries. |
| **Frontend Framework** | Angular | **Angular 19+** (Standalone Components, Signals, `HttpClient`) |
| **Responsive Support** | **Phone, Tablet & Desktop** | Powered by Angular CDK `BreakpointObserver`, CSS Flex/Grid media queries, collapsible drawers, adaptive Monaco diff view |
| **UI Component Library** | **Angular Material (Wrapped)** | All components wrapped inside `components/atoms/` and `components/organisms/` (`app-button`, `app-input`, `app-card`, `app-badge`, `app-drawer`, `app-dialog`) |
| **UI Design System** | **CashPilot-aligned Style** | Brand `#00ccff`, soft background `#edf3f8`, `"Be Vietnam Pro"` font, clean cards, header, profile, side menu, List pages, and Edit drawers implemented natively via CSS tokens |
| **State & Data Fetching** | **Native Signals + `HttpClient`** | 100% stable, official Angular Signals (`signal`, `computed`, `effect`) and `HttpClient` service pattern |
| **Editor & Diff Engine** | **Monaco Editor** | `ngx-monaco-editor-v2` / `monaco-editor` (VS Code engine, Markdown editor, Side-by-Side Diff on Desktop/Tablet, Inline Diff on Mobile) |
| **Markdown Preview** | **`ngx-markdown`** | HTML preview with GFM, syntax highlighting, and Mermaid diagram support |

---

## 3. Data Model (Domain-Driven Design)

### Domain Interfaces
- **`IEntityBase`**: Common entity audit contract (`Id`, `CreatedBy`, `CreatedOn`, `UpdatedBy`, `UpdatedOn`).
- **`EntityBase`**: Abstract base class (`IEntityBase`, `Description`, `IsActive = true`).
- **`IAggregateRoot`**: Marker interface for DDD aggregate root boundaries (`Workspace`, `User`, `Project`, `Node`).

### Domain Enums
- **`NodeType`**: `Folder = 1`, `File = 2`, `Template = 3`
- **`ProjectPermissionType`**: `CanView = 1`, `CanEdit = 2`
- **`SnapshotStatus`**: `Working = 1`, `Approved = 2`

### Entity Relationship Diagram

```mermaid
erDiagram
    Workspace ||--o{ User : "has"
    Workspace ||--o{ Project : "contains"
    Workspace ||--o{ Node : "owns global nodes & templates"
    User ||--o{ ProjectUserPermission : "assigned"
    User ||--o{ Project : "creates"

    Project ||--o{ ProjectUserPermission : "has members"
    Project }o--|| Node : "uses template (InstructionTemplateNodeId)"
    Project ||--o{ Node : "contains project nodes"
    Project ||--o{ ProjectSharedFile : "mounts shared files"

    Node ||--o{ NodeClosure : "ancestor"
    Node ||--o{ NodeClosure : "descendant"
    Node ||--o{ NodeSnapshot : "has permanent snapshot history"
    Node ||--o{ ProjectSharedFile : "shared into projects"

    Workspace {
        uuid Id PK "Direct WorkspaceId from Zentry (Aggregate Root)"
        string Name
        string Description
        boolean IsActive
        uuid CreatedBy
        datetime CreatedOn
        uuid UpdatedBy
        datetime UpdatedOn
    }

    User {
        uuid Id PK "Direct UserId from Zentry (Aggregate Root)"
        uuid WorkspaceId FK
        string Email
        string UserName
        string FirstName
        string LastName
        string UserSettings "JSON: timezone, UI language"
        string_array Roles "contains SuperAdministrator etc"
        string_array Permissions "text[] for future reuse"
        string Description
        boolean IsActive
        uuid CreatedBy
        datetime CreatedOn
        uuid UpdatedBy
        datetime UpdatedOn
    }

    Project {
        uuid Id PK "Aggregate Root"
        uuid WorkspaceId FK
        string Name
        uuid CreatorId FK "Top Admin (Creator User)"
        uuid InstructionTemplateNodeId FK "points to Node with Type = Template"
        string Description
        boolean IsActive
        uuid CreatedBy
        datetime CreatedOn
        uuid UpdatedBy
        datetime UpdatedOn
    }

    ProjectUserPermission {
        uuid Id PK
        uuid ProjectId FK
        uuid UserId FK
        enum_ProjectPermissionType Permission "CanView | CanEdit"
        string Description
        boolean IsActive
        uuid CreatedBy
        datetime CreatedOn
        uuid UpdatedBy
        datetime UpdatedOn
    }

    Node {
        uuid Id PK "Aggregate Root"
        uuid WorkspaceId FK
        uuid ProjectId FK "null only for Templates"
        string Name
        enum_NodeType Type "Folder | File | Template"
        text Content "live working markdown content"
        string Description
        boolean IsActive
        uuid CreatedBy
        datetime CreatedOn
        uuid UpdatedBy
        datetime UpdatedOn
    }

    ProjectSharedFile {
        uuid ProjectId PK,FK "Consuming Project"
        uuid FileNodeId PK,FK "Shared File Node"
        uuid CreatedBy
        datetime CreatedOn
    }

    NodeClosure {
        uuid AncestorId FK
        uuid DescendantId FK
        int Depth
    }

    NodeSnapshot {
        uuid Id PK
        uuid NodeId FK
        text SnapshotContent "frozen baseline content for historical tracking"
        enum_SnapshotStatus Status "Working | Approved"
        string Description
        boolean IsActive
        uuid CreatedBy
        datetime CreatedOn
        uuid UpdatedBy
        datetime UpdatedOn
    }
```

### Access Control Rules
1. **Creator (Top Admin)**: User who created the project (`CreatorId`). Has full permissions and is the only person permitted to assign, modify, or revoke permissions for other users on that project.
2. **`CanEdit`**: Can create, update, move, delete folders/files, and take or approve snapshots.
3. **`CanView`**: Read-only access. Blocked from write actions across both Web UI and MCP API tools.
4. **`SuperAdministrator`**: Only users having the `SuperAdministrator` role in `User.Roles` can create, edit, or delete instruction templates (`Type = NodeType.Template`).
5. **Cross-Project File Sharing**: Consuming projects have **read-only** access to files mounted via `ProjectSharedFiles`. Only original project members with `CanEdit` (or Creator) can modify or delete the source file.

---

## 4. Zentry Sync Integration Flow (Kafka on Aiven)

```mermaid
sequenceDiagram
    participant Zentry as Zentry Service
    participant Kafka as Kafka on Aiven
    participant Consumer as RuleAgent Kafka User Sync Consumer
    participant DB as PostgreSQL

    Zentry->>Kafka: Publish UserSyncEvent on User/Role changes
    Kafka->>Consumer: Consume UserSyncEvent
    Consumer->>DB: Upsert User & Workspace records
    DB-->>Consumer: Saved
```

---

## 5. Machine-to-Machine MCP Authentication & Integration Flow

```mermaid
sequenceDiagram
    participant Zentry as Zentry Auth Server
    participant CA as Coding Agent (MCP Client)
    participant MCP as RuleAgent MCP Server
    participant DB as PostgreSQL

    Note over CA,Zentry: 1. Acquire Token from Zentry
    CA->>Zentry: Request Token (Client Credentials / User Token)
    Zentry-->>CA: Access Token (JWT Bearer)

    Note over CA,MCP: 2. MCP Request with Bearer Token & Project Scope
    CA->>MCP: MCP Request (Bearer <token>, Project-Id: <guid> or parameter)
    MCP->>Zentry: OpenIddict validates signature & claims against Zentry
    MCP->>DB: Check ProjectUserPermission for UserId on ProjectId (CanView vs CanEdit)
    alt Valid Token & Has Permission
        MCP->>DB: Execute requested Tool, Resource, or Prompt
        DB-->>MCP: Success
        MCP-->>CA: Response (Tool Result, Resource Content, or Prompt Messages)
    else Invalid Token or Forbidden
        MCP-->>CA: Error: Unauthorized or Forbidden
    end
```

---

## 6. Features Reference Breakdown

### Feature 001 — Foundation, Auth (OIDC/OpenIddict), Entities & Zentry Kafka Sync
- Create ASP.NET Core 10 Web API project using Feature Slice Architecture (`Domain/`, `Features/`, `Infrastructure/`)
- Set up EF Core 10 with PostgreSQL
- Create `EntityBase` class (`Id`, `Description`, `IsActive`, `CreatedBy`, `CreatedOn`, `UpdatedBy`, `UpdatedOn`) and `IAggregateRoot`
- Implement domain entities with DDD patterns and enums: `Workspace`, `User`, `Project`, `ProjectUserPermission`, `Node`, `NodeClosure`, `NodeSnapshot`
- Implement Auth & Profile slices: OpenIddict validation against Zentry authority, Zentry OIDC with cookie session for Web UI, token refresh, `GET /api/profile/current`
- Implement Kafka consumer service (`Infrastructure/Messaging/`) for syncing `UserSyncEvent` from Aiven
- Implement Settings slice (`Features/Settings/`) with `GET /api/settings` for user locale & timezone preferences
- Implement Project CRUD slice (`Features/Projects/`) with Creator top-admin role assignment
- Implement Project permission management slice (`Features/ProjectPermissions/`)

### Feature 002 — Folder & File Management (Closure Table)
- Implement Closure Table slice (`Features/Nodes/`)
- Create folder and file/template under a parent folder
- Move folder/file to a new parent (updating closure relationships)
- Rename folder/file
- Soft-delete folder/file (with cascading closure cleanups)
- Full tree and direct children queries
- Ancestor breadcrumb queries
- Project member view/edit permission enforcement across all node operations

### Feature 003 — Node Content & NodeSnapshot History
- Implement snapshot slice (`Features/Snapshots/`)
- Update live `Node.Content` directly (requires `CanEdit` or Creator)
- Create `NodeSnapshot` baseline when beginning a feature (`Status = SnapshotStatus.Working`)
- Retrieve live content and full snapshot history (`ORDER BY CreatedOn DESC`)
- Compare live content vs active snapshot (or any historical snapshot) for side-by-side diff
- Explicit user approval: mark `NodeSnapshot` as `SnapshotStatus.Approved` (retaining all history permanently)

### Feature 004 — Instruction Templates (Unified via Node with SuperAdministrator Check)
- Implement templates slice (`Features/Templates/`)
- CRUD for instruction templates (`Node` with `Type = NodeType.Template` and `ProjectId = null`)
- Enforce `SuperAdministrator` role requirement on template creation, update, and deletion
- Assign template node when creating a project (`Project.InstructionTemplateNodeId`)
- Snapshot and diffing support for template updates via `NodeSnapshot`
- Retrieve active instruction template rules for a project

### Feature 005 — Cross-Project File Sharing via ProjectSharedFiles
- Implement file sharing slice (`Features/SharedFiles/`)
- Share files from an owning project to other consuming projects within the same workspace via `ProjectSharedFiles` join table
- Enforce that only `NodeType.File` can be shared (folders cannot be shared, preserving the strict tree closure table)
- Consuming projects have **read-only** access to shared files
- Query project files returns local project files + mounted shared files
- Manage sharing (link, unlink, list shared files) for project Creators and members with `CanEdit`

### Feature 006 — MCP Server (Coding Agent Tools)
- Implement MCP slice (`Features/Mcp/`) using official `ModelContextProtocol.AspNetCore` SDK over Streamable HTTP (`/mcp`, SSE compatible)
- Authenticate MCP requests using Zentry OAuth2 bearer token header + `Project-Id` (or per-call `projectId` parameter), validated via OpenIddict
- **MCP Tools**: `list_project_tree`, `read_file`, `get_template_rules`, `list_shared_files`, `get_snapshot_history`, `get_node_diff`, `create_folder`, `create_file`, `update_file`, `move_node`, `delete_node`, `create_node_snapshot`, `approve_node_snapshot`

### Feature 007 — Web UI (Angular 19+ & Angular Material)
- Establish CashPilot-aligned design system in Angular (Material 3 theme, CSS custom properties, `"Be Vietnam Pro"` font, clean card surfaces, responsive layout tokens)
- Implement Responsive Header component (logo, hamburger menu for mobile/tablet, workspace/project switcher, CashPilot-style User Profile menu)
- Implement Responsive Side Menu navigation component (permanent on desktop, slide-out overlay drawer on mobile/tablet)
- Implement reusable responsive List Page & Data Table layout (adaptive horizontal scroll/card layout on mobile, clean action header)
- Implement reusable Create/Edit Form Drawer layout (slide-over on desktop/tablet, full-width 100% on phone)
- Implement User Settings page (matching CashPilot User Profile card layout with Timezone/Locale preferences)
- Implement Project list & creation/edit drawer (Project Name, Instruction Template selection)
- Implement Project member permission management dialog for Project Creators to assign `CanView` vs `CanEdit`
- Implement Instruction Templates management view (restricted to `SuperAdministrator` role)
- Implement responsive File Explorer tree view component using Angular Material (`mat-tree` / CDK Tree) with collapsible sidebar toggle for mobile
- Workspace global rules management view
- Markdown preview (`ngx-markdown`) and Monaco Editor component (read-only when `CanView`)
- Snapshot history panel & Monaco Diff viewer (side-by-side on desktop/tablet, inline diff on phone)
- Explicit "Approve Changes" action button with confirmation dialog
