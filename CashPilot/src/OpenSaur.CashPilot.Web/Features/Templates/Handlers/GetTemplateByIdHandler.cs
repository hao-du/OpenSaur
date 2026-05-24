using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Templates.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Templates.Handlers;

public static class GetTemplateByIdHandler
{
    public static async Task<Results<Ok<TemplateDetailResponse>, NotFound>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        var template = await dbContext.Templates
            .AsNoTracking()
            .Where(candidate => candidate.OwnerId == currentUserId && candidate.Id == id)
            .Select(candidate => new TemplateDetailResponse(
                candidate.Id,
                candidate.Name,
                candidate.Description,
                candidate.TemplateType,
                candidate.TemplateDataJson,
                candidate.IsActive))
            .SingleOrDefaultAsync(cancellationToken);

        if (template is null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(template);
    }
}
