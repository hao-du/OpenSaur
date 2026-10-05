using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.Templates.Dtos;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

namespace OpenSaur.Brainbubby.Web.Features.Templates.Handlers;

public static class GetTemplateByIdHandler
{
    public static async Task<IResult> HandleAsync(
        Guid id,
        CurrentUserContext userContext,
        BrainbubbyDbContext dbContext,
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

        var response = new TemplateResponse(
            template.Id,
            template.WorkspaceId,
            template.Name,
            template.Description,
            template.Content,
            template.IsActive,
            template.CreatedOn,
            template.UpdatedOn);

        return Results.Ok(response);
    }
}
