using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Currencies.Dtos;
using OpenSaur.CashPilot.Web.Features.Currencies.Validations;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Currencies.Handlers;

public static class CreateCurrencyHandler
{
    private static readonly CreateCurrencyRequestValidator Validator = new();

    public static async Task<Results<Created<CurrencyResponse>, ValidationProblem, Conflict<ProblemDetails>>> HandleAsync(
        CreateCurrencyRequest request,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);
        var validationResult = await Validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var normalizedShortName = request.ShortName.Trim().ToUpperInvariant();
        var duplicateShortNameExists = await dbContext.Currencies
            .AnyAsync(candidate => candidate.OwnerId == currentUserId && candidate.ShortName == normalizedShortName, cancellationToken);
        if (duplicateShortNameExists)
        {
            return AppHttpResults.Conflict("Short code already exists.", "A currency with the same short code already exists.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        if (request.IsDefault)
        {
            await dbContext.Currencies
                .Where(candidate => candidate.OwnerId == currentUserId && candidate.IsDefault)
                .ExecuteUpdateAsync(updates => updates.SetProperty(candidate => candidate.IsDefault, false), cancellationToken);
        }

        var currency = new Currency
        {
            OwnerId = currentUserId,
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
