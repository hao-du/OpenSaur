using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Currencies.Dtos;
using OpenSaur.CashPilot.Web.Features.Currencies.Validations;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Currencies.Handlers;

public static class UpdateCurrencyHandler
{
    private static readonly UpdateCurrencyRequestValidator Validator = new();

    public static async Task<Results<Ok<CurrencyResponse>, ValidationProblem, NotFound<ProblemDetails>, Conflict<ProblemDetails>>> HandleAsync(
        Guid id,
        UpdateCurrencyRequest request,
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

        var currency = await dbContext.Currencies.SingleOrDefaultAsync(candidate => candidate.Id == id && candidate.OwnerId == currentUserId, cancellationToken);
        if (currency is null)
        {
            return AppHttpResults.NotFound("Currency not found.", "No currency matched the specified identifier.");
        }

        var normalizedShortName = request.ShortName.Trim().ToUpperInvariant();
        var duplicateShortNameExists = await dbContext.Currencies
            .AnyAsync(candidate => candidate.OwnerId == currentUserId && candidate.Id != id && candidate.ShortName == normalizedShortName, cancellationToken);
        if (duplicateShortNameExists)
        {
            return AppHttpResults.Conflict("Short code already exists.", "A currency with the same short code already exists.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        if (request.IsDefault && !currency.IsDefault)
        {
            await dbContext.Currencies
                .Where(candidate => candidate.OwnerId == currentUserId && candidate.Id != id && candidate.IsDefault)
                .ExecuteUpdateAsync(updates => updates.SetProperty(candidate => candidate.IsDefault, false), cancellationToken);
        }

        currency.Description = request.Description?.Trim();
        currency.IsDefault = request.IsDefault;
        currency.Name = request.Name.Trim();
        currency.ShortName = normalizedShortName;

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return TypedResults.Ok(new CurrencyResponse(
            currency.Id,
            currency.Name,
            currency.ShortName,
            currency.Description,
            currency.IsDefault));
    }
}
