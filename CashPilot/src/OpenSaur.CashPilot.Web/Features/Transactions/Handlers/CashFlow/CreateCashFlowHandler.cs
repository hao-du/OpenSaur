using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using OpenSaur.CashPilot.Web.Features.Transactions.Validations;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class CreateCashFlowHandler
{
    private static readonly CreateCashFlowRequestValidator Validator = new();

    public static async Task<Results<Created<Guid>, BadRequest<ProblemDetails>, ValidationProblem>> HandleAsync(
        CreateCashFlowRequest request,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        if (currentUserId == Guid.Empty)
        {
            return AppHttpResults.BadRequest("User is required.", "Transactions require an authenticated user identifier.");
        }

        var validationResult = await Validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }
        
        var hasCurrency = await dbContext.Currencies
            .AnyAsync(x => x.Id == request.CurrencyId && x.OwnerId == currentUserId && x.IsActive, cancellationToken);
        if (!hasCurrency)
        {
            return AppHttpResults.BadRequest("Currency is invalid.", "The selected currency does not exist for the current user.");
        }

        var transaction = new Transaction
        {
            Amount = request.Amount,
            CurrencyId = request.CurrencyId,
            Description = request.Description?.Trim() ?? string.Empty,
            Direction = (TransactionDirection)request.Direction,
            OwnerId = currentUserId,
            TransactionDate = request.TransactionDate
        };

        var cashFlow = new CashFlow
        {
            Description = request.Description?.Trim() ?? string.Empty,
            Transaction = transaction
        };

        dbContext.CashFlows.Add(cashFlow);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created($"/api/transactions/cashflows/{cashFlow.Id}", cashFlow.Id);
    }
}
