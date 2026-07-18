using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Currencies.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Currencies.Handlers;

public static class GetCurrenciesHandler
{
    public static async Task<Ok<IReadOnlyList<CurrencyResponse>>> HandleAsync(
        [FromQuery] bool? isActive,
        [FromQuery] string? name,
        [FromQuery] string? shortName,
        ClaimsPrincipal user,
        IHybridCacheService cache,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var cacheKey = CacheConstants.CurrenciesKey(currentUserId);

        var result = await cache.GetOrCreateAsync(
            cacheKey,
            async (key) =>
            {
                var normalizedName = name?.Trim();
                var normalizedShortName = shortName?.Trim();
                var activeFilter = isActive ?? true;
                var query = dbContext.Currencies
                    .AsNoTracking()
                    .Where(currency => currency.OwnerId == currentUserId && currency.IsActive == activeFilter);

                if (!string.IsNullOrWhiteSpace(normalizedName))
                {
                    query = query.Where(currency => EF.Functions.ILike(currency.Name, $"%{normalizedName}%"));
                }

                if (!string.IsNullOrWhiteSpace(normalizedShortName))
                {
                    query = query.Where(currency => EF.Functions.ILike(currency.ShortName, $"%{normalizedShortName}%"));
                }

                return await query
                    .OrderByDescending(currency => currency.IsDefault)
                    .ThenBy(currency => currency.ShortName)
                    .Select(currency => new CurrencyResponse(
                        currency.Id,
                        currency.Name,
                        currency.ShortName,
                        currency.Description,
                        currency.IsDefault
                    ))
                    .ToListAsync(cancellationToken);
            },
            CacheConstants.DefaultTtl);

        return TypedResults.Ok<IReadOnlyList<CurrencyResponse>>(result);
    }
}
