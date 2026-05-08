using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Counterparties.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Counterparties.Handlers;

public static class GetCounterpartyByIdHandler
{
    public static async Task<Results<Ok<CounterpartyResponse>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var result = await dbContext.Counterparties
            .AsNoTracking()
            .Where(counterparty => counterparty.Id == id)
            .Select(counterparty => new CounterpartyResponse(
                counterparty.Id,
                counterparty.FullName,
                counterparty.Email,
                counterparty.PhoneNumber,
                counterparty.Description,
                counterparty.IsActive
            ))
            .SingleOrDefaultAsync(cancellationToken);

        if (result is null)
        {
            return AppHttpResults.NotFound("Counterparty not found.", "No counterparty matched the specified identifier.");
        }

        return TypedResults.Ok(result);
    }
}
