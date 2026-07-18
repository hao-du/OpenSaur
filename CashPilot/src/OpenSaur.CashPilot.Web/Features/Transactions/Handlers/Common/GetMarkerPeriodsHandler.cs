using Microsoft.AspNetCore.Http.HttpResults;
using OpenSaur.CashPilot.Web.Features.Currencies.Services;
using OpenSaur.CashPilot.Web.Features.Tags.Services;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Services;
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
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

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
        return TypedResults.Ok(periods);
    }
}
