using System.ComponentModel;
using Microsoft.EntityFrameworkCore;
using ModelContextProtocol.Server;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.Mcp.Services;
using OpenSaur.Brainbubby.Web.Features.Nodes.Services;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;

namespace OpenSaur.Brainbubby.Web.Features.Mcp.Tools;

[McpServerToolType]
public class McpReadTools
{
    private readonly IMcpContextService _mcpContextService;
    private readonly BrainbubbyDbContext _dbContext;
    private readonly INodeTreeService _nodeTreeService;

    public McpReadTools(
        IMcpContextService mcpContextService,
        BrainbubbyDbContext dbContext,
        INodeTreeService nodeTreeService)
    {
        _mcpContextService = mcpContextService;
        _dbContext = dbContext;
        _nodeTreeService = nodeTreeService;
    }

    [McpServerTool(Name = "list_project_tree", ReadOnly = true)]
    [Description("Returns the complete hierarchical folder and file tree of the active project.")]
    public async Task<string> ListProjectTreeAsync(
        [Description("Optional project ID. If omitted, uses the configured 'Project-Id' header.")] Guid? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var (context, error) = await _mcpContextService.ResolveContextAsync(projectId, cancellationToken);
        if (context is null)
        {
            return $"Error: {error ?? "Unauthorized or missing project context."}";
        }

        var tree = await _nodeTreeService.BuildProjectTreeAsync(
            context.CurrentProject.WorkspaceId,
            context.CurrentProject.Id,
            cancellationToken);

        return System.Text.Json.JsonSerializer.Serialize(tree, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
    }

    [McpServerTool(Name = "read_file", ReadOnly = true)]
    [Description("Reads the live content and details of a file node (either project-local or shared).")]
    public async Task<string> ReadFileAsync(
        [Description("Unique GUID of the file node to read.")] Guid fileId,
        [Description("Optional project ID. If omitted, uses the configured 'Project-Id' header.")] Guid? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var (context, error) = await _mcpContextService.ResolveContextAsync(projectId, cancellationToken);
        if (context is null)
        {
            return $"Error: {error ?? "Unauthorized or missing project context."}";
        }

        var localNode = await _dbContext.Nodes
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == fileId &&
                                      n.WorkspaceId == context.CurrentProject.WorkspaceId &&
                                      n.ProjectId == context.CurrentProject.Id &&
                                      n.Type == NodeType.File &&
                                      n.IsActive, cancellationToken);

        if (localNode is not null)
        {
            var result = new
            {
                localNode.Id,
                localNode.ProjectId,
                localNode.Name,
                localNode.Description,
                localNode.Content,
                IsShared = false,
                localNode.CreatedOn,
                localNode.UpdatedOn
            };
            return System.Text.Json.JsonSerializer.Serialize(result, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
        }

        var isShared = await _dbContext.ProjectSharedFiles
            .AnyAsync(psf => psf.ProjectId == context.CurrentProject.Id && psf.FileNodeId == fileId, cancellationToken);

        if (!isShared)
        {
            return $"Error: File '{fileId}' not found in active project or shared files.";
        }

        var sharedNode = await _dbContext.Nodes
            .AsNoTracking()
            .Include(n => n.Project)
            .FirstOrDefaultAsync(n => n.Id == fileId && n.IsActive, cancellationToken);

        if (sharedNode is null)
        {
            return $"Error: Shared file '{fileId}' is inactive or deleted.";
        }

        var sharedResult = new
        {
            sharedNode.Id,
            sharedNode.ProjectId,
            OwningProject = sharedNode.Project?.Name,
            sharedNode.Name,
            sharedNode.Description,
            sharedNode.Content,
            IsShared = true,
            sharedNode.CreatedOn,
            sharedNode.UpdatedOn
        };

        return System.Text.Json.JsonSerializer.Serialize(sharedResult, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
    }

    [McpServerTool(Name = "get_template_rules", ReadOnly = true)]
    [Description("Retrieves active instruction template rules and guidelines associated with the active project.")]
    public async Task<string> GetTemplateRulesAsync(
        [Description("Optional project ID. If omitted, uses the configured 'Project-Id' header.")] Guid? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var (context, error) = await _mcpContextService.ResolveContextAsync(projectId, cancellationToken);
        if (context is null)
        {
            return $"Error: {error ?? "Unauthorized or missing project context."}";
        }

        if (!context.CurrentProject.InstructionTemplateNodeId.HasValue)
        {
            return "No instruction template assigned to this project.";
        }

        var templateNode = await _dbContext.Nodes
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == context.CurrentProject.InstructionTemplateNodeId.Value &&
                                      n.WorkspaceId == context.CurrentProject.WorkspaceId &&
                                      n.IsActive, cancellationToken);

        if (templateNode is null)
        {
            return "Error: Assigned instruction template node was not found or is inactive.";
        }

        var result = new
        {
            templateNode.Id,
            templateNode.Name,
            templateNode.Description,
            templateNode.Content,
            templateNode.CreatedOn,
            templateNode.UpdatedOn
        };

        return System.Text.Json.JsonSerializer.Serialize(result, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
    }

    [McpServerTool(Name = "list_shared_files", ReadOnly = true)]
    [Description("Lists all files mounted into the current project from other projects (read-only shared files).")]
    public async Task<string> ListSharedFilesAsync(
        [Description("Optional project ID. If omitted, uses the configured 'Project-Id' header.")] Guid? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var (context, error) = await _mcpContextService.ResolveContextAsync(projectId, cancellationToken);
        if (context is null)
        {
            return $"Error: {error ?? "Unauthorized or missing project context."}";
        }

        var sharedFiles = await _dbContext.ProjectSharedFiles
            .AsNoTracking()
            .Where(psf => psf.ProjectId == context.CurrentProject.Id)
            .Join(_dbContext.Nodes.Where(n => n.IsActive),
                psf => psf.FileNodeId,
                n => n.Id,
                (psf, n) => new { psf, n })
            .Join(_dbContext.Projects,
                combined => combined.n.ProjectId,
                p => p.Id,
                (combined, p) => new
                {
                    combined.n.Id,
                    OwningProjectId = combined.n.ProjectId,
                    OwningProjectName = p.Name,
                    combined.n.Name,
                    combined.n.Description,
                    combined.psf.CreatedOn,
                    SharedBy = combined.psf.CreatedBy
                })
            .OrderBy(r => r.Name)
            .ToListAsync(cancellationToken);

        return System.Text.Json.JsonSerializer.Serialize(sharedFiles, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
    }

    [McpServerTool(Name = "get_snapshot_history", ReadOnly = true)]
    [Description("Lists all historical snapshots of a file node ordered from newest to oldest.")]
    public async Task<string> GetSnapshotHistoryAsync(
        [Description("Unique GUID of the file node.")] Guid fileId,
        [Description("Optional project ID. If omitted, uses the configured 'Project-Id' header.")] Guid? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var (context, error) = await _mcpContextService.ResolveContextAsync(projectId, cancellationToken);
        if (context is null)
        {
            return $"Error: {error ?? "Unauthorized or missing project context."}";
        }

        var snapshots = await _dbContext.NodeSnapshots
            .AsNoTracking()
            .Where(s => s.NodeId == fileId && s.IsActive)
            .OrderByDescending(s => s.CreatedOn)
            .Select(s => new
            {
                s.Id,
                s.NodeId,
                s.Status,
                s.Description,
                s.CreatedOn,
                s.CreatedBy,
                s.UpdatedOn,
                s.UpdatedBy
            })
            .ToListAsync(cancellationToken);

        return System.Text.Json.JsonSerializer.Serialize(snapshots, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
    }

    [McpServerTool(Name = "get_node_diff", ReadOnly = true)]
    [Description("Compares a historical snapshot against current live file content for diff inspection.")]
    public async Task<string> GetNodeDiffAsync(
        [Description("Unique GUID of the historical snapshot.")] Guid snapshotId,
        [Description("Optional project ID. If omitted, uses the configured 'Project-Id' header.")] Guid? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var (context, error) = await _mcpContextService.ResolveContextAsync(projectId, cancellationToken);
        if (context is null)
        {
            return $"Error: {error ?? "Unauthorized or missing project context."}";
        }

        var snapshot = await _dbContext.NodeSnapshots
            .AsNoTracking()
            .Include(s => s.Node)
            .FirstOrDefaultAsync(s => s.Id == snapshotId && s.IsActive, cancellationToken);

        if (snapshot is null || snapshot.Node is null)
        {
            return $"Error: Snapshot '{snapshotId}' not found or inactive.";
        }

        var diffResult = new
        {
            SnapshotId = snapshot.Id,
            snapshot.NodeId,
            snapshot.Status,
            SnapshotCreatedOn = snapshot.CreatedOn,
            SnapshotContent = snapshot.SnapshotContent,
            CurrentLiveContent = snapshot.Node.Content
        };

        return System.Text.Json.JsonSerializer.Serialize(diffResult, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
    }
}
