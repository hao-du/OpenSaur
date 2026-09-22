using Microsoft.AspNetCore.Http.HttpResults;
using OpenSaur.CashPilot.Web.Features.Currencies.Services;
using OpenSaur.CashPilot.Web.Features.Tags.Services;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Services;
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetMarkerPeriodsHandler
{
    public static async Task<Ok<IReadOnlyList<MarkerCalendarPeriodResponse>>> HandleAsync(
        [AsParameters] MarkerPeriodsQueryRequest request,
        ClaimsPrincipal user,
        TagService tagService,
        CurrencyService currencyService,
        TransactionService transactionService,
        CashPilotDbContext dbContext,
        ICacheService cacheService,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var cacheKey = CacheConstants.MarkerPeriodsKey(currentUserId, request.MakerId);

        if (currentUserId != Guid.Empty)
        {
            var cached = await cacheService.GetAsync<IReadOnlyList<MarkerCalendarPeriodResponse>>(cacheKey, cancellationToken);
            if (cached is not null)
            {
                return TypedResults.Ok(cached);
            }
        }

        var markerTag = await tagService.GetMarkerTagAsync(currentUserId, request.MakerId, cancellationToken);
        if (markerTag == null)
        {
            return TypedResults.Ok<IReadOnlyList<MarkerCalendarPeriodResponse>>([]);
        }

        var defaultCurrency = await currencyService.GetDefaultCurrencyAsync(currentUserId, cancellationToken);
        if (defaultCurrency == null)
        {
            return TypedResults.Ok<IReadOnlyList<MarkerCalendarPeriodResponse>>([]);
        }

        var periods = await transactionService.BuildLatestMarkerPeriodsAsync(currentUserId, defaultCurrency.Id, markerTag.Name, TransactionService.UNLIMITED_PERIODS, cancellationToken);

        if (currentUserId != Guid.Empty)
        {
            await cacheService.SetAsync(cacheKey, periods, CacheConstants.ShortTtl, cancellationToken);
        }

        return TypedResults.Ok(periods);
    }
}
