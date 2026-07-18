using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using OpenSaur.CashPilot.Web.Features.Banks.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Banks.Handlers;

public static class GetBanksHandler
{
    public static async Task<Ok<IReadOnlyList<BankResponse>>> HandleAsync(
        [FromQuery] bool? isActive,
        [FromQuery] string? name,
        [FromQuery] string? shortName,
        ClaimsPrincipal user,
        IHybridCacheService cache,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var cacheKey = CacheConstants.BanksKey(currentUserId);

        var result = await cache.GetOrCreateAsync(
            cacheKey,
            async (key) =>
            {
                var normalizedName = name?.Trim();
                var normalizedShortName = shortName?.Trim();
                var activeFilter = isActive ?? true;
                var query = dbContext.Banks
                    .AsNoTracking()
                    .Where(bank => bank.OwnerId == currentUserId && bank.IsActive == activeFilter);

                if (!string.IsNullOrWhiteSpace(normalizedName))
                {
                    query = query.Where(bank => EF.Functions.ILike(bank.Name, $"%{normalizedName}%"));
                }

                if (!string.IsNullOrWhiteSpace(normalizedShortName))
                {
                    query = query.Where(bank => EF.Functions.ILike(bank.ShortName, $"%{normalizedShortName}%"));
                }

                return await query
                    .OrderByDescending(bank => bank.IsDefault)
                    .ThenBy(bank => bank.ShortName)
                    .Select(bank => new BankResponse(
                        bank.Id,
                        bank.Name,
                        bank.ShortName,
                        bank.Description,
                        bank.IsDefault
                    ))
                    .ToListAsync(cancellationToken);
            },
            CacheConstants.DefaultTtl);

        return TypedResults.Ok<IReadOnlyList<BankResponse>>(result);
    }
}
