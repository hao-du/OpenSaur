using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class UpdateCashFlowHandler
{
    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        UpdateCashFlowRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (request.Amount <= 0 || (request.Direction != 1 && request.Direction != 2))
        {
            return AppHttpResults.BadRequest("Invalid cashflow payload.", "Amount must be positive and direction must be 1 or 2.");
        }

        var entity = await dbContext.CashFlows
            .Include(x => x.Transaction)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (entity is null)
        {
            return AppHttpResults.NotFound("CashFlow not found.", "No CashFlow matched the specified identifier.");
        }

        entity.Description = request.Description?.Trim() ?? string.Empty;
        entity.IsActive = request.IsActive;
        entity.Transaction.Amount = request.Amount;
        entity.Transaction.CurrencyId = request.CurrencyId;
        entity.Transaction.Direction = (TransactionDirection)request.Direction;
        entity.Transaction.TransactionDate = request.TransactionDate;
        entity.Transaction.Description = request.Description?.Trim() ?? string.Empty;

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(id);
    }
}
