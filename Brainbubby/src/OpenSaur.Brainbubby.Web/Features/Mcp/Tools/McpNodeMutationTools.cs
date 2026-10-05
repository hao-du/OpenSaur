using System.ComponentModel;
using ModelContextProtocol.Server;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.Mcp.Services;
using OpenSaur.Brainbubby.Web.Features.Nodes.Services;

namespace OpenSaur.Brainbubby.Web.Features.Mcp.Tools;

[McpServerToolType]
public class McpNodeMutationTools
{
    private readonly IMcpContextService _mcpContextService;
    private readonly INodeTreeService _nodeTreeService;

    public McpNodeMutationTools(
        IMcpContextService mcpContextService,
        INodeTreeService nodeTreeService)
    {
        _mcpContextService = mcpContextService;
        _nodeTreeService = nodeTreeService;
    }

    [McpServerTool(Name = "create_folder", Destructive = false)]
    [Description("Creates a new folder under an optional parent folder in the project.")]
    public async Task<string> CreateFolderAsync(
        [Description("Folder name.")] string name,
        [Description("Optional parent folder GUID.")] Guid? parentId = null,
        [Description("Optional folder description.")] string? description = null,
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

        if (string.IsNullOrWhiteSpace(name))
        {
            return "Error: Missing or empty 'name' argument.";
        }

        var node = new Node
        {
            Id = Guid.CreateVersion7(),
            WorkspaceId = context.CurrentProject.WorkspaceId,
            ProjectId = context.CurrentProject.Id,
            Name = name.Trim(),
            Type = NodeType.Folder,
            Description = description?.Trim(),
            Content = string.Empty,
            IsActive = true,
            CreatedBy = context.CurrentUser.Id,
            CreatedOn = DateTime.UtcNow
        };

        var success = await _nodeTreeService.CreateNodeAsync(node, parentId, cancellationToken);
        if (!success)
        {
            return "Error: Failed to create folder: Parent folder not found, not a folder, or inactive.";
        }

        return $"Folder created successfully. Id: {node.Id}, Name: {node.Name}";
    }

    [McpServerTool(Name = "create_file", Destructive = false)]
    [Description("Creates a new markdown or text file under an optional parent folder in the project.")]
    public async Task<string> CreateFileAsync(
        [Description("File name.")] string name,
        [Description("File content (markdown/text).")] string content = "",
        [Description("Optional parent folder GUID.")] Guid? parentId = null,
        [Description("Optional file description.")] string? description = null,
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

        if (string.IsNullOrWhiteSpace(name))
        {
            return "Error: Missing or empty 'name' argument.";
        }

        var node = new Node
        {
            Id = Guid.CreateVersion7(),
            WorkspaceId = context.CurrentProject.WorkspaceId,
            ProjectId = context.CurrentProject.Id,
            Name = name.Trim(),
            Type = NodeType.File,
            Description = description?.Trim(),
            Content = content ?? string.Empty,
            IsActive = true,
            CreatedBy = context.CurrentUser.Id,
            CreatedOn = DateTime.UtcNow
        };

        var success = await _nodeTreeService.CreateNodeAsync(node, parentId, cancellationToken);
        if (!success)
        {
            return "Error: Failed to create file: Parent folder not found or inactive.";
        }

        return $"File created successfully. Id: {node.Id}, Name: {node.Name}";
    }

    [McpServerTool(Name = "move_node", Destructive = false)]
    [Description("Moves a folder or file to a new parent folder or to the project root.")]
    public async Task<string> MoveNodeAsync(
        [Description("Unique GUID of the node to move.")] Guid nodeId,
        [Description("Destination parent folder GUID (null for project root).")] Guid? newParentId = null,
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

        var updatedOn = await _nodeTreeService.MoveSubtreeAsync(
            nodeId,
            newParentId,
            context.CurrentUser.Id,
            cancellationToken);

        if (!updatedOn.HasValue)
        {
            return "Error: Cannot move node to the destination (cycle detected, destination is not a folder, or inactive).";
        }

        return $"Node moved successfully at {updatedOn.Value:o}.";
    }

    [McpServerTool(Name = "delete_node", Destructive = true)]
    [Description("Soft-deletes a folder or file and all its descendants.")]
    public async Task<string> DeleteNodeAsync(
        [Description("Unique GUID of the node to delete.")] Guid nodeId,
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

        await _nodeTreeService.SoftDeleteSubtreeAsync(nodeId, context.CurrentUser.Id, cancellationToken);
        return $"Node '{nodeId}' and any descendants soft-deleted successfully.";
    }
}

