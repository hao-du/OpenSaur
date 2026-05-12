using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class CreateCashFlowHandler
{
    public static async Task<Results<Created<Guid>, BadRequest<ProblemDetails>>> HandleAsync(
        CreateCashFlowRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (request.Amount <= 0 || (request.Direction != 1 && request.Direction != 2))
        {
            return AppHttpResults.BadRequest("Invalid cashflow payload.", "Amount must be positive and direction must be 1 or 2.");
        }

        var transaction = new Transaction
        {
            Amount = request.Amount,
            CurrencyId = request.CurrencyId,
            Description = request.Description?.Trim() ?? string.Empty,
            Direction = (TransactionDirection)request.Direction,
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
