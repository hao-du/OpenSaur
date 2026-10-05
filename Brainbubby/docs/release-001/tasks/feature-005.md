# Feature 005: Cross-Project File Sharing (`Features/SharedFiles/`)

## Overview
Implement cross-project file sharing via the `ProjectSharedFiles` join table in `Features/SharedFiles/`. Every rule, skill, and documentation file belongs to an owning project (`Node.ProjectId`). Other projects in the same workspace can link/share these files into their project scope. Consuming projects have **read-only** access to the shared files; only the original project members with `CanEdit` or Creator permission can modify or delete the source file.

---

## Tasks

- [x] 1. Add `ProjectSharedFile` domain entity and EF Core configuration in `Domain/` and `Infrastructure/Database/Configurations/`, and add migration.
- [x] 2. Create DTOs and FluentValidation validators for sharing operations in `Features/SharedFiles/Dtos/` and `Features/SharedFiles/Validations/`.
- [x] 3. Implement file sharing mutation handlers (`ShareFileWithProjectHandler`, `UnshareFileFromProjectHandler`) enforcing `CanEdit`/Creator on the target project.
- [x] 4. Implement file sharing query handlers (`GetProjectSharedFilesHandler`, `GetSharedFileContentHandler`) with workspace isolation and read-only semantics.
- [x] 5. Map endpoints in `Features/SharedFiles/SharedFilesEndpoints.cs`, register services in `Program.cs`, and verify build.

