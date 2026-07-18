using Microsoft.AspNetCore.Http.HttpResults;
using OpenSaur.CashPilot.Web.Features.Tags.Dtos;
using OpenSaur.CashPilot.Web.Features.Tags.Services;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Tags.Handlers;

public static class GetMarkerTagsHandler
{
    public static async Task<Ok<IReadOnlyList<TagDefinitionResponse>>> HandleAsync(
        ClaimsPrincipal user,
        TagService tagService,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        var items = await tagService.GetMarkerTagsAsync(currentUserId, cancellationToken);

        return TypedResults.Ok<IReadOnlyList<TagDefinitionResponse>>(items);
    }
}
