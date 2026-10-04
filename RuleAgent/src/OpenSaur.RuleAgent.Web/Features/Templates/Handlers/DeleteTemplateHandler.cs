using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Domain;
using OpenSaur.RuleAgent.Web.Features.Nodes.Services;
using OpenSaur.RuleAgent.Web.Infrastructure.Auth;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Templates.Handlers;

public static class DeleteTemplateHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
        CurrentUserContext userContext,
        RuleAgentDbContext dbContext,
        INodeTreeService nodeTreeService,
        CancellationToken cancellationToken)
    {
        if (!userContext.IsAuthenticated)
        {
            return Results.Unauthorized();
        }

        // Must have SuperAdministrator role to delete instruction templates
        if (!userContext.IsSuperAdministrator)
        {
            return Results.Forbid();
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

        var template = await dbContext.Nodes
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == id &&
                                      n.WorkspaceId == currentUser.WorkspaceId &&
                                      n.ProjectId == null &&
                                      n.Type == NodeType.Template &&
                                      n.IsActive, cancellationToken);

        if (template is null)
        {
            return Results.NotFound(new { message = "Instruction template not found." });
        }

        // Soft delete template node atomically
        await nodeTreeService.SoftDeleteSubtreeAsync(id, currentUser.Id, cancellationToken);

        return Results.NoContent();
    }
}
