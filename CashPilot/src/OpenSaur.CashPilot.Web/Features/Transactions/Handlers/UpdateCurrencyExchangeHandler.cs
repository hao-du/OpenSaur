using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class UpdateCurrencyExchangeHandler
{
    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        UpdateCurrencyExchangeRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (request.ExchangeRate <= 0 || request.OutLeg.Amount <= 0 || request.InLeg.Amount <= 0)
        {
            return AppHttpResults.BadRequest("Invalid exchange payload.", "Exchange rate and leg amounts must be positive.");
        }

        var entity = await dbContext.CurrencyExchanges
            .Include(x => x.CurrencyExchangeTransactions)
                .ThenInclude(x => x.Transaction)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (entity is null)
        {
            return AppHttpResults.NotFound("CurrencyExchange not found.", "No CurrencyExchange matched the specified identifier.");
        }

        var outLeg = entity.CurrencyExchangeTransactions.FirstOrDefault(x => x.Transaction.Direction == TransactionDirection.Out);
        var inLeg = entity.CurrencyExchangeTransactions.FirstOrDefault(x => x.Transaction.Direction == TransactionDirection.In);

        if (outLeg is null || inLeg is null)
        {
            return AppHttpResults.BadRequest("Invalid exchange data.", "Exchange requires one In and one Out leg.");
        }

        entity.ExchangeRate = request.ExchangeRate;
        entity.ExchangeDate = request.ExchangeDate;
        entity.Description = request.Description?.Trim() ?? string.Empty;
        entity.IsActive = request.IsActive;

        outLeg.Description = request.OutLeg.Description?.Trim() ?? string.Empty;
        outLeg.IsActive = request.IsActive;
        outLeg.Transaction.Amount = request.OutLeg.Amount;
        outLeg.Transaction.CurrencyId = request.OutLeg.CurrencyId;
        outLeg.Transaction.TransactionDate = request.ExchangeDate;
        outLeg.Transaction.Description = outLeg.Description;

        inLeg.Description = request.InLeg.Description?.Trim() ?? string.Empty;
        inLeg.IsActive = request.IsActive;
        inLeg.Transaction.Amount = request.InLeg.Amount;
        inLeg.Transaction.CurrencyId = request.InLeg.CurrencyId;
        inLeg.Transaction.TransactionDate = request.ExchangeDate;
        inLeg.Transaction.Description = inLeg.Description;

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(id);
    }
}
