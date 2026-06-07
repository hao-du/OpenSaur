using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Tags.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Tags.Handlers;

public static class UpdateTagHandler
{
    public static async Task<Results<Ok<TagDefinitionResponse>, NotFound<ProblemDetails>, Conflict<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        Guid id,
        SaveTagDefinitionRequest request,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var entity = await dbContext.TagDefinitions.SingleOrDefaultAsync(x => x.Id == id && x.OwnerId == currentUserId, cancellationToken);
        if (entity is null)
        {
            return TypedResults.NotFound(new ProblemDetails { Title = "Tag not found", Detail = "No matching tag definition found." });
        }

        var name = request.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
        {
            return TypedResults.BadRequest(new ProblemDetails { Title = "Invalid name", Detail = "Tag name is required." });
        }

        var duplicate = await dbContext.TagDefinitions.AnyAsync(x => x.OwnerId == currentUserId && x.Id != id && x.Name == name, cancellationToken);
        if (duplicate)
        {
            return TypedResults.Conflict(new ProblemDetails { Title = "Tag exists", Detail = "A tag with this name already exists." });
        }

        entity.Name = name;
        entity.MatchingTerms = TagTermCodec.Encode(request.MatchingTerms);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(new TagDefinitionResponse(entity.Id, entity.Name, TagTermCodec.Decode(entity.MatchingTerms), entity.IsActive));
    }
}
