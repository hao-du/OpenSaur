using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Templates.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Templates.Handlers;

public static class GetTemplatesHandler
{
    public static async Task<Ok<IReadOnlyList<TemplateListItemResponse>>> HandleAsync(
        [FromQuery] bool? isActive,
        [FromQuery] string? name,
        [FromQuery] TemplateType? templateType,
        [FromQuery] bool getDetail,
        ClaimsPrincipal user,
        IHybridCacheService cache,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var cacheKey = CacheConstants.TemplatesKey(currentUserId);

        var result = await cache.GetOrCreateAsync(
            cacheKey,
            async (key) =>
            {
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

                return await query
                    .OrderBy(template => template.TemplateType)
                    .ThenBy(template => template.Name)
                    .Select(template => new TemplateListItemResponse(
                        template.Id,
                        template.Name,
                        template.Description,
                        template.TemplateType,
                        getDetail ? template.TemplateDataJson : null,
                        template.IsActive))
                    .ToListAsync(cancellationToken);
            },
            CacheConstants.DefaultTtl);

        return TypedResults.Ok<IReadOnlyList<TemplateListItemResponse>>(result);
    }
}
