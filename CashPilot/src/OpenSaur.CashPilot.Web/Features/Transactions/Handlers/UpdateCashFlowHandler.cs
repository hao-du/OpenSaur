using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class UpdateCashFlowHandler
{
    public static async Task<Results<Ok<TransactionResponse>, BadRequest<ProblemDetails>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        UpsertCashFlowRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var validationError = TransactionValidation.ValidateCashFlow(request);
        if (validationError is not null)
        {
            return AppHttpResults.BadRequest("Invalid transaction payload.", validationError);
        }

        var cashFlow = await dbContext.CashFlows
            .Include(candidate => candidate.Transaction)
            .SingleOrDefaultAsync(candidate => candidate.Id == id && candidate.IsActive && candidate.Transaction.IsActive, cancellationToken);
        if (cashFlow is null)
        {
            return AppHttpResults.NotFound("Transaction not found.", "No transaction matched the specified identifier.");
        }

        var currency = await dbContext.Currencies
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == request.CurrencyId && candidate.IsActive, cancellationToken);
        if (currency is null)
        {
            return AppHttpResults.BadRequest("Invalid transaction payload.", "Currency does not exist or is inactive.");
        }

        cashFlow.Transaction.Amount = request.Amount;
        cashFlow.Transaction.CurrencyId = request.CurrencyId;
        cashFlow.Transaction.Description = request.Description?.Trim();
        cashFlow.Transaction.TransactedOn = request.TransactedOn;
        cashFlow.IsIncome = request.IsIncome;

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(new TransactionResponse(
            cashFlow.Id,
            cashFlow.Transaction.Amount,
            cashFlow.Transaction.CurrencyId,
            currency.Name,
            cashFlow.Transaction.Description,
            cashFlow.IsIncome,
            cashFlow.Transaction.TransactedOn,
            "CashFlow"));
    }
}
