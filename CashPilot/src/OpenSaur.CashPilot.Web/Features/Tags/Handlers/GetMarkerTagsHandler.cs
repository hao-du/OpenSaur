using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Tags.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Tags.Handlers;

public static class GetMarkerTagsHandler
{
    public static async Task<Ok<IReadOnlyList<TagDefinitionResponse>>> HandleAsync(
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        
        var items = await dbContext.TagDefinitions
            .AsNoTracking()
            .Where(x => x.OwnerId == currentUserId && x.IsActive && x.Marker)
            .OrderBy(x => x.Name)
            .Select(x => new TagDefinitionResponse(
                x.Id,
                x.Name,
                TagTermCodec.Decode(x.MatchingTerms),
                x.IsActive,
                x.Marker,
                x.IsDefaultMaker))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok<IReadOnlyList<TagDefinitionResponse>>(items);
    }
}
