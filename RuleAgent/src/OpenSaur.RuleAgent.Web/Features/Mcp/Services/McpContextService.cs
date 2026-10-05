using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Domain;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Mcp.Services;

public sealed class McpContextService(
    IClaimService claimService,
    RuleAgentDbContext dbContext,
    IHttpContextAccessor httpContextAccessor) : IMcpContextService
{
    public const string ProjectHeaderName = "Project-Id";

    public async Task<(McpContext? Context, string? ErrorMessage)> ResolveContextAsync(
        Guid? projectIdOverride = null,
        CancellationToken cancellationToken = default)
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return (null, "No active HTTP request context.");
        }

        return await ResolveContextAsync(httpContext, httpContext.User, projectIdOverride, cancellationToken);
    }

    public async Task<(McpContext? Context, string? ErrorMessage)> ResolveContextAsync(
        HttpContext httpContext,
        ClaimsPrincipal principal,
        Guid? projectIdOverride = null,
        CancellationToken cancellationToken = default)
    {
        var userContext = claimService.GetUserContext(principal);
        if (!userContext.IsAuthenticated)
        {
            return (null, "Authentication required. Provide a valid Bearer token from Zentry.");
        }

        var currentUser = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u =>
                (userContext.UserId.HasValue && u.Id == userContext.UserId.Value) ||
                (!string.IsNullOrWhiteSpace(userContext.Email) && u.Email == userContext.Email),
                cancellationToken);

        if (currentUser is null)
        {
            return (null, "User record not found in workspace.");
        }

        // Determine target projectId: parameter override first, then Project-Id header
        Guid targetProjectId;
        if (projectIdOverride.HasValue && projectIdOverride.Value != Guid.Empty)
        {
            targetProjectId = projectIdOverride.Value;
        }
        else if (httpContext.Request.Headers.TryGetValue(ProjectHeaderName, out var headerValues) &&
                 Guid.TryParse(headerValues.FirstOrDefault(), out var parsedProjectId))
        {
            targetProjectId = parsedProjectId;
        }
        else
        {
            return (null, $"Missing project identifier. Provide 'projectId' in the tool call or configure the '{ProjectHeaderName}' HTTP header.");
        }

        var project = await dbContext.Projects
            .AsNoTracking()
            .Include(p => p.Permissions)
            .FirstOrDefaultAsync(p => p.Id == targetProjectId && p.WorkspaceId == currentUser.WorkspaceId && p.IsActive, cancellationToken);

        if (project is null)
        {
            return (null, $"Project '{targetProjectId}' not found or inactive in the current workspace.");
        }

        var isCreator = project.CreatorId == currentUser.Id;
        var permission = project.Permissions.FirstOrDefault(p => p.UserId == currentUser.Id && p.IsActive);

        if (!isCreator && permission is null)
        {
            return (null, $"User does not have access to project '{targetProjectId}'.");
        }

        var canEdit = isCreator || (permission is not null && permission.Permission == ProjectPermissionType.CanEdit);

        var context = new McpContext(userContext, currentUser, project, canEdit);
        return (context, null);
    }
}
