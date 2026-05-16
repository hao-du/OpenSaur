using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Counterparties.Dtos;
using OpenSaur.CashPilot.Web.Features.Counterparties.Validations;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Counterparties.Handlers;

public static class CreateCounterpartyHandler
{
    private static readonly CreateCounterpartyRequestValidator Validator = new();

    public static async Task<Results<Created<CounterpartyResponse>, ValidationProblem>> HandleAsync(
        CreateCounterpartyRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var validationResult = await Validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return AppHttpResults.ValidationProblem(validationResult);
        }

        var counterparty = new Counterparty
        {
            Description = request.Description?.Trim(),
            Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
            FullName = request.FullName.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim()
        };

        dbContext.Counterparties.Add(counterparty);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created($"/api/counterparties/{counterparty.Id}", new CounterpartyResponse(
            counterparty.Id,
            counterparty.FullName,
            counterparty.Email,
            counterparty.PhoneNumber,
            counterparty.Description,
            counterparty.IsActive));
    }
}
