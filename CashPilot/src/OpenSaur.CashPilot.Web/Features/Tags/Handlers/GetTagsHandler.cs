using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Tags.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Tags.Handlers;

public static class GetTagsHandler
{
    public static async Task<Ok<IReadOnlyList<TagDefinitionResponse>>> HandleAsync(
        bool? isActive,
        string? name,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var query = dbContext.TagDefinitions
            .AsNoTracking()
            .Where(x => x.OwnerId == currentUserId);
        
        if (isActive.HasValue)
        {
            query = query.Where(x => x.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(name))
        {
            var normalizedName = name.Trim();
            query = query.Where(x => x.Name.Contains(normalizedName));
        }

        var items = await query.OrderBy(x => x.Name)
            .Select(x => new TagDefinitionResponse(
                x.Id,
                x.Name,
                TagTermCodec.Decode(x.MatchingTerms),
                x.IsActive))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok<IReadOnlyList<TagDefinitionResponse>>(items);
    }
}
