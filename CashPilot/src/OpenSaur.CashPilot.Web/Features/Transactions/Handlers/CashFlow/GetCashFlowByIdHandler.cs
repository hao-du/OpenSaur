using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using OpenSaur.CashPilot.Web.Features.Tags;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetCashFlowByIdHandler
{
    public static async Task<Results<Ok<CashFlowDetailResponse>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        var entity = await dbContext.CashFlows
            .AsNoTracking()
            .Include(x => x.Transaction)
            .Include(x => x.TransactionItems)
            .SingleOrDefaultAsync(x => x.Id == id && x.Transaction.OwnerId == currentUserId, cancellationToken);

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
            entity.IsActive,
            TagTermCodec.Decode(entity.Tags),
            entity.TransactionItems.Select(x => new TransactionItemResponse(x.Id, x.Name, x.Amount)).ToList()));
    }
}
