using Microsoft.AspNetCore.Http.HttpResults;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Services;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetTransactionsHandler
{
    public static async Task<Ok<IReadOnlyList<TransactionListItemResponse>>> HandleAsync(
        [AsParameters] TransactionFilterRequest filter,
        ClaimsPrincipal user,
        TransactionService transactionService,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        var efFilter = new TransactionFilterParams(
            !string.IsNullOrEmpty(filter.Description) ? filter.Description : null,
            !string.IsNullOrEmpty(filter.FromDate) ? DateOnly.Parse(filter.FromDate) : null,
            !string.IsNullOrEmpty(filter.ToDate) ? DateOnly.Parse(filter.ToDate) : null,
            filter.ShowOnlyInitialDeposits,
            filter.Types);

        var result = await transactionService.GetListItemsAsync(currentUserId, efFilter, cancellationToken);

        return TypedResults.Ok<IReadOnlyList<TransactionListItemResponse>>(result);
    }
}
