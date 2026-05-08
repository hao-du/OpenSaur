using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class CreateCashFlowHandler
{
    public static async Task<Results<Created<TransactionResponse>, BadRequest<ProblemDetails>>> HandleAsync(
        UpsertCashFlowRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var validationError = TransactionValidation.ValidateCashFlow(request);
        if (validationError is not null)
        {
            return AppHttpResults.BadRequest("Invalid transaction payload.", validationError);
        }

        var currency = await dbContext.Currencies
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == request.CurrencyId && candidate.IsActive, cancellationToken);
        if (currency is null)
        {
            return AppHttpResults.BadRequest("Invalid transaction payload.", "Currency does not exist or is inactive.");
        }

        var transaction = new Transaction
        {
            Amount = request.Amount,
            CurrencyId = request.CurrencyId,
            Description = request.Description?.Trim(),
            TransactedOn = request.TransactedOn
        };
        var cashFlow = new CashFlow
        {
            IsIncome = request.IsIncome,
            Transaction = transaction
        };

        dbContext.CashFlows.Add(cashFlow);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created($"/api/transactions/cashflows/{cashFlow.Id}", new TransactionResponse(
            cashFlow.Id,
            transaction.Amount,
            transaction.CurrencyId,
            currency.Name,
            transaction.Description,
            cashFlow.IsIncome,
            transaction.TransactedOn,
            "CashFlow"));
    }
}
