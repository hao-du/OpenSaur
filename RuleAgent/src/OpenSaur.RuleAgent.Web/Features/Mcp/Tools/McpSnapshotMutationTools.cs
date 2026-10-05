using System.ComponentModel;
using ModelContextProtocol.Server;
using OpenSaur.RuleAgent.Web.Features.Mcp.Services;
using OpenSaur.RuleAgent.Web.Features.Snapshots.Services;

namespace OpenSaur.RuleAgent.Web.Features.Mcp.Tools;

[McpServerToolType]
public class McpSnapshotMutationTools
{
    private readonly IMcpContextService _mcpContextService;
    private readonly ISnapshotService _snapshotService;

    public McpSnapshotMutationTools(
        IMcpContextService mcpContextService,
        ISnapshotService snapshotService)
    {
        _mcpContextService = mcpContextService;
        _snapshotService = snapshotService;
    }

    [McpServerTool(Name = "update_file", Destructive = false)]
    [Description("Updates the live content of a project file.")]
    public async Task<string> UpdateFileAsync(
        [Description("Unique GUID of the file node.")] Guid fileId,
        [Description("New text/markdown content.")] string content,
        [Description("Optional project ID. If omitted, uses the configured 'Project-Id' header.")] Guid? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var (context, error) = await _mcpContextService.ResolveContextAsync(projectId, cancellationToken);
        if (context is null)
        {
            return $"Error: {error ?? "Unauthorized or missing project context."}";
        }

        if (!context.CanEdit)
        {
            return "Error: Permission Denied: You need 'CanEdit' or Creator permission on this project.";
        }

        var updatedOn = await _snapshotService.UpdateContentAsync(
            fileId,
            context.CurrentProject.WorkspaceId,
            content ?? string.Empty,
            context.CurrentUser.Id,
            cancellationToken);

        if (!updatedOn.HasValue)
        {
            return $"Error: File '{fileId}' not found, inactive, or is a folder.";
        }

        return $"File updated successfully at {updatedOn.Value:o}.";
    }

    [McpServerTool(Name = "create_node_snapshot", Destructive = false)]
    [Description("Creates a working snapshot of a file node for baseline comparison.")]
    public async Task<string> CreateNodeSnapshotAsync(
        [Description("Unique GUID of the file node.")] Guid fileId,
        [Description("Optional description of why the snapshot was created.")] string? description = null,
        [Description("Optional project ID. If omitted, uses the configured 'Project-Id' header.")] Guid? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var (context, error) = await _mcpContextService.ResolveContextAsync(projectId, cancellationToken);
        if (context is null)
        {
            return $"Error: {error ?? "Unauthorized or missing project context."}";
        }

        if (!context.CanEdit)
        {
            return "Error: Permission Denied: You need 'CanEdit' or Creator permission on this project.";
        }

        var snapshot = await _snapshotService.CreateSnapshotAsync(
            fileId,
            context.CurrentProject.WorkspaceId,
            description,
            context.CurrentUser.Id,
            cancellationToken);

        if (snapshot is null)
        {
            return $"Error: Cannot create snapshot for file '{fileId}' (not found, inactive, or is a folder).";
        }

        return $"Snapshot created successfully. SnapshotId: {snapshot.Id}, Status: {snapshot.Status}";
    }

    [McpServerTool(Name = "approve_node_snapshot", Destructive = false)]
    [Description("Approves a working snapshot, permanently marking it as Approved.")]
    public async Task<string> ApproveNodeSnapshotAsync(
        [Description("Unique GUID of the snapshot.")] Guid snapshotId,
        [Description("Optional project ID. If omitted, uses the configured 'Project-Id' header.")] Guid? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var (context, error) = await _mcpContextService.ResolveContextAsync(projectId, cancellationToken);
        if (context is null)
        {
            return $"Error: {error ?? "Unauthorized or missing project context."}";
        }

        if (!context.CanEdit)
        {
            return "Error: Permission Denied: You need 'CanEdit' or Creator permission on this project.";
        }

        var snapshot = await _snapshotService.ApproveSnapshotAsync(
            snapshotId,
            context.CurrentProject.WorkspaceId,
            context.CurrentUser.Id,
            cancellationToken);

        if (snapshot is null)
        {
            return $"Error: Snapshot '{snapshotId}' not found or inactive.";
        }

        return $"Snapshot approved successfully. SnapshotId: {snapshot.Id}, Status: {snapshot.Status}";
    }
}

