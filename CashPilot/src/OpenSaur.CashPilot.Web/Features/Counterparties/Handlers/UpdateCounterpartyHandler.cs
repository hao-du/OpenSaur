using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Counterparties.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Counterparties.Handlers;

public static class UpdateCounterpartyHandler
{
    public static async Task<Results<Ok<CounterpartyResponse>, BadRequest<ProblemDetails>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        UpdateCounterpartyRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var validationError = CounterpartyValidation.ValidateUpdate(request);
        if (validationError is not null)
        {
            return AppHttpResults.BadRequest("Invalid counterparty payload.", validationError);
        }

        var counterparty = await dbContext.Counterparties.SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (counterparty is null)
        {
            return AppHttpResults.NotFound("Counterparty not found.", "No counterparty matched the specified identifier.");
        }

        counterparty.Description = request.Description?.Trim();
        counterparty.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
        counterparty.FullName = request.FullName.Trim();
        counterparty.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
        counterparty.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(new CounterpartyResponse(
            counterparty.Id,
            counterparty.FullName,
            counterparty.Email,
            counterparty.PhoneNumber,
            counterparty.Description,
            counterparty.IsActive));
    }
}
