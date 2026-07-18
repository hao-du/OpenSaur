using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Services;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetTransactionsByPeriodHandler
{
    public static async Task<Ok<IReadOnlyList<TransactionListItemResponse>>> HandleAsync(
        [AsParameters] TransactionPeriodQueryRequest request,
        ClaimsPrincipal user,
        TransactionService transactionService,
        CancellationToken cancellationToken)
    {
        if (request.StartDate is null && request.EndDate is null)
        {
            return TypedResults.Ok<IReadOnlyList<TransactionListItemResponse>>([]);
        }

        var startDate = request.StartDate;
        var endDate = request.EndDate;

        if (startDate is null)
        {
            endDate ??= DateOnly.FromDateTime(DateTime.UtcNow.Date);
            startDate = endDate.Value.AddDays(-30);
        }
        else if (endDate is null)
        {
            endDate = startDate.Value.AddDays(30);
        }

        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var result = await transactionService.GetTransactionsByPeriodAsync(currentUserId, startDate, endDate, cancellationToken);
        return TypedResults.Ok<IReadOnlyList<TransactionListItemResponse>>(result);
    }
}
