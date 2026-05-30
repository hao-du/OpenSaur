using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetCurrencyExchangeByIdHandler
{
    public static async Task<Results<Ok<CurrencyExchangeDetailResponse>, NotFound<ProblemDetails>, BadRequest<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        var entity = await dbContext.CurrencyExchanges
            .AsNoTracking()
            .Include(x => x.CurrencyExchangeTransactions)
                .ThenInclude(x => x.Transaction)
            .Include(x => x.TransactionItems)
            .SingleOrDefaultAsync(x => x.Id == id && x.CurrencyExchangeTransactions.Any(y => y.Transaction.OwnerId == currentUserId), cancellationToken);

        if (entity is null)
        {
            return AppHttpResults.NotFound("CurrencyExchange not found.", "No CurrencyExchange matched the specified identifier.");
        }

        var outLeg = entity.CurrencyExchangeTransactions.FirstOrDefault(x => x.IsActive && x.Transaction.IsActive && x.Transaction.Direction == TransactionDirection.Out);
        var inLeg = entity.CurrencyExchangeTransactions.FirstOrDefault(x => x.IsActive && x.Transaction.IsActive && x.Transaction.Direction == TransactionDirection.In);

        if (outLeg is null || inLeg is null)
        {
            return AppHttpResults.BadRequest("Invalid exchange data.", "Exchange requires one In and one Out leg.");
        }

        return TypedResults.Ok(new CurrencyExchangeDetailResponse(
            entity.Id,
            entity.ExchangeRate,
            entity.ExchangeDate,
            new ExchangeLegResponse(outLeg.Transaction.CurrencyId, outLeg.Transaction.Amount, outLeg.Description),
            new ExchangeLegResponse(inLeg.Transaction.CurrencyId, inLeg.Transaction.Amount, inLeg.Description),
            entity.Description,
            entity.IsActive,
            entity.TransactionItems.Select(x => new TransactionItemResponse(x.Id, x.Name, x.Amount)).ToList()));
    }
}
