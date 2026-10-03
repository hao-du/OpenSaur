using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Features.Projects.Dtos;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Projects.Handlers;

public static class GetProjectsHandler
{
    public static async Task<IResult> HandleAsync(
        CurrentUserContext userContext,
        RuleAgentDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (!userContext.IsAuthenticated)
        {
            return Results.Unauthorized();
        }

        var currentUser = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u =>
                (userContext.UserId.HasValue && u.Id == userContext.UserId.Value) ||
                (!string.IsNullOrWhiteSpace(userContext.Email) && u.Email == userContext.Email),
                cancellationToken);

        if (currentUser is null)
        {
            return Results.Unauthorized();
        }

        var projects = await dbContext.Projects
            .AsNoTracking()
            .Include(p => p.Creator)
            .Include(p => p.InstructionTemplateNode)
            .Include(p => p.Permissions)
            .Where(p => p.WorkspaceId == currentUser.WorkspaceId && p.IsActive)
            .Where(p => p.CreatorId == currentUser.Id || p.Permissions.Any(perm => perm.UserId == currentUser.Id && perm.IsActive))
            .OrderByDescending(p => p.CreatedOn)
            .Select(p => new ProjectListItemResponse(
                p.Id,
                p.Name,
                p.Description,
                p.CreatorId,
                p.Creator != null ? $"{p.Creator.FirstName} {p.Creator.LastName}".Trim() : "Unknown",
                p.InstructionTemplateNodeId,
                p.InstructionTemplateNode != null ? p.InstructionTemplateNode.Name : null,
                p.IsActive,
                p.CreatedOn,
                p.CreatorId == currentUser.Id
                    ? "Creator"
                    : p.Permissions.Where(perm => perm.UserId == currentUser.Id).Select(perm => perm.Permission.ToString()).FirstOrDefault() ?? "None"
            ))
            .ToListAsync(cancellationToken);

        return Results.Ok(projects);
    }
}
