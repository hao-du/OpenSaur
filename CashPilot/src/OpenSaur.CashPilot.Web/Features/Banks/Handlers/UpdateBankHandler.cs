using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Banks.Dtos;
using OpenSaur.CashPilot.Web.Features.Banks.Validations;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Banks.Handlers;

public static class UpdateBankHandler
{
    private static readonly UpdateBankRequestValidator Validator = new();

    public static async Task<Results<Ok<BankResponse>, ValidationProblem, NotFound<ProblemDetails>, Conflict<ProblemDetails>>> HandleAsync(
        Guid id,
        UpdateBankRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var validationResult = await Validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var bank = await dbContext.Banks.SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (bank is null)
        {
            return AppHttpResults.NotFound("Bank not found.", "No bank matched the specified identifier.");
        }

        var normalizedShortName = request.ShortName.Trim();
        var duplicateShortNameExists = await dbContext.Banks
            .AnyAsync(candidate => candidate.Id != id && candidate.ShortName == normalizedShortName, cancellationToken);
        if (duplicateShortNameExists)
        {
            return AppHttpResults.Conflict("Short name already exists.", "A bank with the same short name already exists.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        if (request.IsDefault && !bank.IsDefault)
        {
            await dbContext.Banks
                .Where(candidate => candidate.Id != id && candidate.IsDefault)
                .ExecuteUpdateAsync(updates => updates.SetProperty(candidate => candidate.IsDefault, false), cancellationToken);
        }

        bank.Description = request.Description?.Trim();
        bank.IsDefault = request.IsDefault;
        bank.Name = request.Name.Trim();
        bank.ShortName = normalizedShortName;

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return TypedResults.Ok(new BankResponse(
            bank.Id,
            bank.Name,
            bank.ShortName,
            bank.Description,
            bank.IsDefault));
    }
}
