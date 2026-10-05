# Feature 006: MCP Server (Model Context Protocol) (`Features/Mcp/`)

## Overview
Implement the Model Context Protocol (MCP) server slice using the official `ModelContextProtocol.AspNetCore` SDK over Streamable HTTP (`/mcp`, SSE compatible). Exposes Brainbubby project tree, rules, live files, and snapshot management tools to AI coding agents (Claude Desktop, Cursor, Antigravity, Roo Code, etc.). Authenticated via Zentry OAuth2 Bearer tokens with project context scoped by the `Project-Id` header or explicit `projectId` parameter (checking `ProjectUserPermission` for `CanView` vs `CanEdit` / Creator permissions).

---

## Tasks

- [x] 1. Configure official MCP SDK (`ModelContextProtocol.AspNetCore`) package reference and project setup.
- [x] 2. Implement `IMcpContextService` / `McpContextService` to extract authenticated user and project authorization from `HttpContext` (Bearer token + `Project-Id` header / parameter override).
- [x] 3. Refactor MCP Read Tools (`McpReadTools`) using idiomatic SDK `[McpServerTool]` attributes and strongly-typed method parameters (`list_project_tree`, `read_file`, `get_template_rules`, `list_shared_files`, `get_snapshot_history`, `get_node_diff`).
- [x] 4. Refactor MCP Mutation Tools (`McpNodeMutationTools`, `McpSnapshotMutationTools`) using idiomatic SDK `[McpServerTool]` attributes and strongly-typed method parameters (`create_folder`, `create_file`, `move_node`, `delete_node`, `update_file`, `create_node_snapshot`, `approve_node_snapshot`).
- [x] 5. Register MCP server in `Program.cs` via `AddMcpServer().WithHttpTransport().WithTools<...>()`, map endpoint via `app.MapMcp("/mcp")`, and verify clean build.

