using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class CreateTransferHandler
{
    public static async Task<Results<Created<Guid>, BadRequest<ProblemDetails>>> HandleAsync(
        CreateTransferRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (request.Amount <= 0 || request.TransferType is < 1 or > 4)
        {
            return AppHttpResults.BadRequest("Invalid transfer payload.", "Amount must be positive and transfer type must be valid.");
        }

        var transfer = new Transfer
        {
            Amount = request.Amount,
            CounterpartyId = request.CounterpartyId,
            CurrencyId = request.CurrencyId,
            Description = request.Description?.Trim() ?? string.Empty,
            DueDate = request.DueDate,
            Status = TransferStatus.Active,
            TransactionDate = request.TransactionDate,
            TransferType = (TransferType)request.TransferType
        };

        dbContext.Transfers.Add(transfer);
        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Created($"/api/transactions/transfers/{transfer.Id}", transfer.Id);
    }
}
