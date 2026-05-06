using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Banks.Handlers;

public static class DeleteBankHandler
{
    public static async Task<Results<NoContent, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var bank = await dbContext.Banks
            .SingleOrDefaultAsync(candidate => candidate.Id == id && candidate.IsActive, cancellationToken);
        if (bank is null)
        {
            return AppHttpResults.NotFound("Bank not found.", "No bank matched the specified identifier.");
        }

        bank.IsActive = false;
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.NoContent();
    }
}
