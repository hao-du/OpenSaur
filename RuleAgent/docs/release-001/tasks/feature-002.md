# Feature 002: Folder & File Management (Closure Table)

## Overview
Implement the hierarchical folder and file management slice in `Features/Nodes/` using PostgreSQL Closure Table (`NodeClosures`). Supports creating folders and files under parent folders, full tree queries, direct children listing, breadcrumb retrieval, moving nodes across parents (subtree closure relocation), renaming, and soft-deletion. Project member permissions (`CanView` vs `CanEdit` / Creator) are enforced across all operations.

---

## Tasks

- [x] 1. Create DTOs and FluentValidation validators for node operations in `Features/Nodes/Dtos/` and `Features/Nodes/Validations/`.
- [x] 2. Implement `NodeTreeService` (`INodeTreeService`) in `Features/Nodes/Services/` handling closure table mechanics (self-link, ancestor links, subtree relocation, cascading delete).
- [x] 3. Implement read handlers in `Features/Nodes/Handlers/` (`GetProjectTreeHandler`, `GetNodeChildrenHandler`, `GetNodeBreadcrumbHandler`, `GetNodeByIdHandler`) with permission checks.
- [x] 4. Implement mutation handlers in `Features/Nodes/Handlers/` (`CreateNodeHandler`, `UpdateNodeHandler`, `MoveNodeHandler`, `DeleteNodeHandler`) enforcing `CanEdit` or Creator role.
- [x] 5. Map endpoints in `Features/Nodes/NodesEndpoints.cs`, integrate `IClaimService`, register services in `Program.cs`, and verify build.
