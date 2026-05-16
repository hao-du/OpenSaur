using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Banks.Dtos;
using OpenSaur.CashPilot.Web.Features.Banks.Validations;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Banks.Handlers;

public static class CreateBankHandler
{
    private static readonly CreateBankRequestValidator Validator = new();

    public static async Task<Results<Created<BankResponse>, ValidationProblem, Conflict<ProblemDetails>>> HandleAsync(
        CreateBankRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var validationResult = await Validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var normalizedShortName = request.ShortName.Trim();
        var duplicateShortNameExists = await dbContext.Banks
            .AnyAsync(candidate => candidate.ShortName == normalizedShortName, cancellationToken);
        if (duplicateShortNameExists)
        {
            return AppHttpResults.Conflict("Short name already exists.", "A bank with the same short name already exists.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        if (request.IsDefault)
        {
            await dbContext.Banks
                .Where(candidate => candidate.IsDefault)
                .ExecuteUpdateAsync(updates => updates.SetProperty(candidate => candidate.IsDefault, false), cancellationToken);
        }

        var bank = new Bank
        {
            Description = request.Description?.Trim(),
            IsDefault = request.IsDefault,
            Name = request.Name.Trim(),
            ShortName = normalizedShortName
        };

        dbContext.Banks.Add(bank);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return TypedResults.Created($"/api/banks/{bank.Id}", new BankResponse(
            bank.Id,
            bank.Name,
            bank.ShortName,
            bank.Description,
            bank.IsDefault));
    }
}
