using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.RuleAgent.Web.Domain;
using OpenSaur.RuleAgent.Web.Features.Templates.Dtos;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Templates.Handlers;

public static class GetTemplatesHandler
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

        var templates = await dbContext.Nodes
            .AsNoTracking()
            .Where(n => n.WorkspaceId == currentUser.WorkspaceId &&
                        n.ProjectId == null &&
                        n.Type == NodeType.Template &&
                        n.IsActive)
            .OrderBy(n => n.Name)
            .Select(n => new TemplateResponse(
                n.Id,
                n.WorkspaceId,
                n.Name,
                n.Description,
                n.Content,
                n.IsActive,
                n.CreatedOn,
                n.UpdatedOn))
            .ToListAsync(cancellationToken);

        return Results.Ok(templates);
    }
}
