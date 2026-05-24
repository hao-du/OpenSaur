using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Templates.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Templates.Handlers;

public static class GetTemplatesHandler
{
    public static async Task<Ok<IReadOnlyList<TemplateListItemResponse>>> HandleAsync(
        [FromQuery] bool? isActive,
        [FromQuery] string? name,
        [FromQuery] TemplateType? templateType,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var normalizedName = name?.Trim();
        var activeFilter = isActive ?? true;

        var query = dbContext.Templates
            .AsNoTracking()
            .Where(template => template.OwnerId == currentUserId && template.IsActive == activeFilter);

        if (!string.IsNullOrWhiteSpace(normalizedName))
        {
            query = query.Where(template => EF.Functions.ILike(template.Name, $"%{normalizedName}%"));
        }

        if (templateType.HasValue)
        {
            query = query.Where(template => template.TemplateType == templateType.Value);
        }

        var templates = await query
            .OrderBy(template => template.TemplateType)
            .ThenBy(template => template.Name)
            .Select(template => new TemplateListItemResponse(
                template.Id,
                template.Name,
                template.Description,
                template.TemplateType,
                template.IsActive))
            .ToListAsync(cancellationToken);

        return TypedResults.Ok<IReadOnlyList<TemplateListItemResponse>>(templates);
    }
}
