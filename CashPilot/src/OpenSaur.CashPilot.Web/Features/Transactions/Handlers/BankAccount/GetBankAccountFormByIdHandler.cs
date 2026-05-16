using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetBankAccountFormByIdHandler
{
    public static async Task<Results<Ok<SaveBankAccountFormRequest>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        var entity = await dbContext.BankAccounts
            .AsNoTracking()
            .Include(x => x.BankAccountTransactions)
                .ThenInclude(x => x.Transaction)
            .SingleOrDefaultAsync(x => x.Id == id && (!x.BankAccountTransactions.Any() || x.BankAccountTransactions.All(y => y.Transaction.OwnerId == currentUserId)), cancellationToken);

        if (entity is null)
        {
            return AppHttpResults.NotFound("BankAccount not found.", "No BankAccount matched the specified identifier.");
        }

        var details = entity.BankAccountTransactions
            .OrderBy(x => x.Transaction.TransactionDate)
            .Select(x => new SaveBankAccountDetailRequest(
                x.Id,
                x.Transaction.CurrencyId,
                x.Transaction.Amount,
                (byte)x.Transaction.Direction,
                (byte)x.TransactionType,
                x.Transaction.TransactionDate,
                x.Description,
                x.IsActive))
            .ToList();

        return TypedResults.Ok(new SaveBankAccountFormRequest(
            entity.Id,
            entity.BankId,
            entity.CurrencyId,
            entity.Amount,
            entity.InterestRate,
            entity.StartDate,
            entity.MaturityDate,
            (byte)entity.Status,
            entity.AccountNumber,
            entity.Description,
            entity.IsActive,
            details));
    }
}
