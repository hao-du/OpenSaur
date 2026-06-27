using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Queries;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetTransactionsHandler
{
    public static async Task<Ok<IReadOnlyList<TransactionListItemResponse>>> HandleAsync(
        [AsParameters] TransactionFilterRequest filter,
        ClaimsPrincipal user,
        IEnumerable<ITransactionQueryProvider> transactionQueryProviders,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        var efFilter = new TransactionFilterParams(
            !string.IsNullOrEmpty(filter.Description) ? filter.Description : null,
            !string.IsNullOrEmpty(filter.FromDate) ? DateOnly.Parse(filter.FromDate) : null,
            !string.IsNullOrEmpty(filter.ToDate) ? DateOnly.Parse(filter.ToDate) : null,
            filter.ShowOnlyInitialDeposits,
            filter.Types);

        var unifiedProvider = transactionQueryProviders.FirstOrDefault(p => p.ProviderType == "Unified");
        
        if (unifiedProvider != null)
        {
            var unifiedResult = await unifiedProvider.GetListItemsAsync(currentUserId, efFilter, cancellationToken);
            return TypedResults.Ok<IReadOnlyList<TransactionListItemResponse>>(unifiedResult);
        }

        var filteredProviders = transactionQueryProviders;

        if (filter.Types.Length > 0)
        {
            filteredProviders = transactionQueryProviders.Where(p =>
                filter.Types.Contains(p.ProviderType));
        }

        var result = await filteredProviders.GetListItemsAsync(currentUserId, efFilter, cancellationToken);

        return TypedResults.Ok<IReadOnlyList<TransactionListItemResponse>>(result);
    }
}
