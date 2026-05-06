using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Banks.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Banks.Handlers;

public static class GetBankByIdHandler
{
    public static async Task<Results<Ok<BankResponse>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var result = await dbContext.Banks
            .AsNoTracking()
            .Where(bank => bank.Id == id)
            .Select(bank => new BankResponse(
                bank.Id,
                bank.Name,
                bank.ShortName,
                bank.Description,
                bank.IsDefault
            ))
            .SingleOrDefaultAsync(cancellationToken);

        if (result is null)
        {
            return AppHttpResults.NotFound("Bank not found.", "No bank matched the specified identifier.");
        }

        return TypedResults.Ok(result);
    }
}
