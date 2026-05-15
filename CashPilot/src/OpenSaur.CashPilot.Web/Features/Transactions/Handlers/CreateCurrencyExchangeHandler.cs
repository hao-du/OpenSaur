using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class CreateCurrencyExchangeHandler
{
    public static async Task<Results<Created<Guid>, BadRequest<ProblemDetails>>> HandleAsync(
        CreateCurrencyExchangeRequest request,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        if (currentUserId == Guid.Empty)
        {
            return AppHttpResults.BadRequest("User is required.", "Transactions require an authenticated user identifier.");
        }

        if (request.ExchangeRate <= 0 || request.OutLeg.Amount <= 0 || request.InLeg.Amount <= 0)
        {
            return AppHttpResults.BadRequest("Invalid exchange payload.", "Exchange rate and all amounts must be positive.");
        }

        var exchange = new CurrencyExchange
        {
            Description = request.Description?.Trim() ?? string.Empty,
            ExchangeDate = request.ExchangeDate,
            ExchangeRate = request.ExchangeRate
        };

        var outTransaction = new Transaction
        {
            Amount = request.OutLeg.Amount,
            CurrencyId = request.OutLeg.CurrencyId,
            Description = request.OutLeg.Description?.Trim() ?? string.Empty,
            Direction = TransactionDirection.Out,
            OwnerId = currentUserId,
            TransactionDate = request.ExchangeDate
        };

        var inTransaction = new Transaction
        {
            Amount = request.InLeg.Amount,
            CurrencyId = request.InLeg.CurrencyId,
            Description = request.InLeg.Description?.Trim() ?? string.Empty,
            Direction = TransactionDirection.In,
            OwnerId = currentUserId,
            TransactionDate = request.ExchangeDate
        };

        exchange.CurrencyExchangeTransactions.Add(new CurrencyExchangeTransaction
        {
            Description = request.Description?.Trim() ?? string.Empty,
            Transaction = outTransaction
        });

        exchange.CurrencyExchangeTransactions.Add(new CurrencyExchangeTransaction
        {
            Description = request.Description?.Trim() ?? string.Empty,
            Transaction = inTransaction
        });

        dbContext.CurrencyExchanges.Add(exchange);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created($"/api/transactions/exchanges/{exchange.Id}", exchange.Id);
    }
}
