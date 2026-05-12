using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetCashFlowByIdHandler
{
    public static async Task<Results<Ok<CashFlowDetailResponse>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var entity = await dbContext.CashFlows
            .AsNoTracking()
            .Include(x => x.Transaction)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (entity is null)
        {
            return AppHttpResults.NotFound("CashFlow not found.", "No CashFlow matched the specified identifier.");
        }

        return TypedResults.Ok(new CashFlowDetailResponse(
            entity.Id,
            entity.Transaction.CurrencyId,
            entity.Transaction.Amount,
            (byte)entity.Transaction.Direction,
            entity.Transaction.TransactionDate,
            entity.Description,
            entity.IsActive));
    }
}
