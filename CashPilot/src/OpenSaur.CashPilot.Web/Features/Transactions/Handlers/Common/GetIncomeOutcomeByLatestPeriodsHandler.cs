using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Services;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetIncomeOutcomeByLatestPeriodsHandler
{
    public static async Task<Ok<IncomeOutcomeLatestPeriodsResponse>> HandleAsync(
        [AsParameters] IncomeOutcomeLatestPeriodsQueryRequest request,
        ClaimsPrincipal user,
        TransactionService transactionService,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var result = await transactionService.GetIncomeOutcomeByLatestPeriodsAsync(currentUserId, request.IsMonthly, cancellationToken);
        return TypedResults.Ok(result);
    }
}
