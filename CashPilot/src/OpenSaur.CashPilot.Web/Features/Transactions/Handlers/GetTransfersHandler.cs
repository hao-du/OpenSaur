using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class GetTransfersHandler
{
    public static async Task<Ok<IReadOnlyList<TransferLookupResponse>>> HandleAsync(
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var rows = await dbContext.Transfers
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.TransactionDate)
            .Select(x => new
            {
                x.Id,
                CounterpartyName = x.Counterparty.FullName,
                TransferType = x.TransferType,
                CurrencyCode = x.Currency.ShortName,
                Status = x.Status,
                x.Amount,
                SettledForLend = x.TransferTransactions.Where(y => y.IsActive && y.Transaction.IsActive && y.Transaction.Direction == TransactionDirection.In).Sum(y => y.Transaction.Amount),
                SettledForBorrow = x.TransferTransactions.Where(y => y.IsActive && y.Transaction.IsActive && y.Transaction.Direction == TransactionDirection.Out).Sum(y => y.Transaction.Amount)
            })
            .ToListAsync(cancellationToken);

        var result = rows.Select(x =>
        {
            var remaining = x.TransferType == TransferType.Lend
                ? x.Amount - x.SettledForLend
                : x.TransferType == TransferType.Borrow
                    ? x.Amount - x.SettledForBorrow
                    : 0m;

            if (remaining < 0m)
            {
                remaining = 0m;
            }

            var status = x.Status;
            if (x.TransferType is TransferType.Lend or TransferType.Borrow)
            {
                status = remaining <= 0m ? TransferStatus.Completed : TransferStatus.Active;
            }

            return new TransferLookupResponse(
                x.Id,
                x.CounterpartyName,
                x.TransferType.ToString(),
                x.CurrencyCode,
                status.ToString(),
                x.Amount,
                remaining);
        }).ToList();

        return TypedResults.Ok<IReadOnlyList<TransferLookupResponse>>(result);
    }
}
