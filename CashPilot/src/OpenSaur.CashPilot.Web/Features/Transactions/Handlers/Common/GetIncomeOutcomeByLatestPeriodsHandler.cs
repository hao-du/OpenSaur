using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Services;
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetIncomeOutcomeByLatestPeriodsHandler
{
    public static async Task<Ok<IncomeOutcomeLatestPeriodsResponse>> HandleAsync(
        [AsParameters] IncomeOutcomeLatestPeriodsQueryRequest request,
        ClaimsPrincipal user,
        TransactionService transactionService,
        ICacheService cacheService,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var cacheKey = CacheConstants.IncomeOutcomeLatestPeriodsKey(currentUserId, request.IsMonthly);

        if (currentUserId != Guid.Empty)
        {
            var cached = await cacheService.GetAsync<IncomeOutcomeLatestPeriodsResponse>(cacheKey, cancellationToken);
            if (cached is not null)
            {
                return TypedResults.Ok(cached);
            }
        }

        var result = await transactionService.GetIncomeOutcomeByLatestPeriodsAsync(currentUserId, request.IsMonthly, cancellationToken);

        if (currentUserId != Guid.Empty)
        {
            await cacheService.SetAsync(cacheKey, result, CacheConstants.ShortTtl, cancellationToken);
        }

        return TypedResults.Ok(result);
    }
}
