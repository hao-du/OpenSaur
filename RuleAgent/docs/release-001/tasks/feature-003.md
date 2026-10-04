# Feature 003: Live Node Content & Permanent NodeSnapshot History/Diffing

## Overview
Implement the live node content editing and immutable snapshot versioning slice in `Features/Snapshots/` (and content editing on nodes). Supports updating active node content, creating permanent baseline snapshots (`Working` status), approving snapshots (`Approved` status), retrieving snapshot history for a node, and generating diff comparison between historical snapshots and current live content.

---

## Tasks

- [x] 1. Create DTOs and FluentValidation validators for snapshot and content operations in `Features/Snapshots/Dtos/` and `Features/Snapshots/Validations/`.
- [x] 2. Implement live node content update handler (`UpdateNodeContentHandler`) with permission checks (`CanEdit` or Creator).
- [x] 3. Implement snapshot mutation handlers (`CreateSnapshotHandler`, `ApproveSnapshotHandler`) enforcing `CanEdit` or Creator role and domain status transitions.
- [x] 4. Implement snapshot query handlers (`GetNodeSnapshotsHandler`, `GetSnapshotByIdHandler`, `GetSnapshotDiffHandler`) with diff generation and permission checks.
- [x] 5. Map endpoints in `Features/Snapshots/SnapshotsEndpoints.cs`, register services in `Program.cs`, and verify build.
