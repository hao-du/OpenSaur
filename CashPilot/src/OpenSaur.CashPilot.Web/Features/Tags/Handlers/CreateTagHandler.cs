using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Tags.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Tags.Handlers;

public static class CreateTagHandler
{
    public static async Task<Results<Created<TagDefinitionResponse>, Conflict<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        SaveTagDefinitionRequest request,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var name = request.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name))
        {
            return TypedResults.BadRequest(new ProblemDetails { Title = "Invalid name", Detail = "Tag name is required." });
        }

        var exists = await dbContext.TagDefinitions.AnyAsync(x => x.OwnerId == currentUserId && x.Name == name, cancellationToken);
        if (exists)
        {
            return TypedResults.Conflict(new ProblemDetails { Title = "Tag exists", Detail = "A tag with this name already exists." });
        }

        var entity = new TagDefinition
        {
            OwnerId = currentUserId,
            Name = name,
            IsActive = request.IsActive,
            MatchingTerms = TagTermCodec.Encode(request.MatchingTerms),
            Marker = request.Marker
        };

        dbContext.TagDefinitions.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created($"/api/tags/{entity.Id}", new TagDefinitionResponse(entity.Id, entity.Name, TagTermCodec.Decode(entity.MatchingTerms), entity.IsActive, entity.Marker));
    }
}
