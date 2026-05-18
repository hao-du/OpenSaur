using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Features.Transactions.Validations;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class UpdateCurrencyExchangeHandler
{
    private static readonly UpdateCurrencyExchangeRequestValidator Validator = new();

    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, ValidationProblem, NotFound<ProblemDetails>>> HandleAsync(
        UpdateCurrencyExchangeRequest request,
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
        
        var currencyIds = new[] { request.OutLeg.CurrencyId, request.InLeg.CurrencyId }.Distinct().ToList();
        var currencyCount = await dbContext.Currencies
            .CountAsync(x => currencyIds.Contains(x.Id) && x.OwnerId == currentUserId && x.IsActive, cancellationToken);
        if (currencyCount != currencyIds.Count)
        {
            return AppHttpResults.BadRequest("Currency is invalid.", "One or more selected currencies do not exist for the current user.");
        }

        var entity = await dbContext.CurrencyExchanges
            .Include(x => x.CurrencyExchangeTransactions)
                .ThenInclude(x => x.Transaction)
            .SingleOrDefaultAsync(x => x.Id == request.Id && x.CurrencyExchangeTransactions.Any(y => y.Transaction.OwnerId == currentUserId), cancellationToken);

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

        return TypedResults.Ok(request.Id);
    }
}
