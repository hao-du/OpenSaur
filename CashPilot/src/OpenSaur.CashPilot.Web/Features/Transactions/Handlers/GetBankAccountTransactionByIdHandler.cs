using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetBankAccountTransactionByIdHandler
{
    public static async Task<Results<Ok<BankAccountTransactionDetailResponse>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        var entity = await dbContext.BankAccountTransactions
            .AsNoTracking()
            .Include(x => x.Transaction)
            .SingleOrDefaultAsync(x => x.Id == id && x.Transaction.OwnerId == currentUserId, cancellationToken);

        if (entity is null)
        {
            return AppHttpResults.NotFound("BankAccountTransaction not found.", "No BankAccountTransaction matched the specified identifier.");
        }

        return TypedResults.Ok(new BankAccountTransactionDetailResponse(
            entity.Id,
            entity.BankAccountId,
            entity.Transaction.CurrencyId,
            entity.Transaction.Amount,
            (byte)entity.Transaction.Direction,
            (byte)entity.TransactionType,
            entity.Transaction.TransactionDate,
            entity.Description,
            entity.IsActive));
    }
}
