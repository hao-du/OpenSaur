using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Currencies.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Currencies.Handlers;

public static class CreateCurrencyHandler
{
    public static async Task<Results<Created<CurrencyResponse>, BadRequest<ProblemDetails>, Conflict<ProblemDetails>>> HandleAsync(
        CreateCurrencyRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var validationError = CurrencyValidation.Validate(request.Name, request.ShortName);
        if (validationError is not null)
        {
            return AppHttpResults.BadRequest("Invalid currency payload.", validationError);
        }

        var normalizedShortName = request.ShortName.Trim().ToUpperInvariant();
        var duplicateShortNameExists = await dbContext.Currencies
            .AnyAsync(candidate => candidate.ShortName == normalizedShortName, cancellationToken);
        if (duplicateShortNameExists)
        {
            return AppHttpResults.Conflict("Short code already exists.", "A currency with the same short code already exists.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        if (request.IsDefault)
        {
            await dbContext.Currencies
                .Where(candidate => candidate.IsDefault)
                .ExecuteUpdateAsync(updates => updates.SetProperty(candidate => candidate.IsDefault, false), cancellationToken);
        }

        var currency = new Currency
        {
            Description = request.Description?.Trim(),
            IsDefault = request.IsDefault,
            Name = request.Name.Trim(),
            ShortName = normalizedShortName
        };

        dbContext.Currencies.Add(currency);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return TypedResults.Created($"/api/currencies/{currency.Id}", new CurrencyResponse(
            currency.Id,
            currency.Name,
            currency.ShortName,
            currency.Description,
            currency.IsDefault));
    }
}
