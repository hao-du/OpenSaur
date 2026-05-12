using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class UpdateTransferHandler
{
    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        UpdateTransferRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (request.Amount <= 0 || request.TransferType is < 1 or > 4 || request.Status is < 1 or > 3)
        {
            return AppHttpResults.BadRequest("Invalid transfer payload.", "Amount must be positive and enum values must be valid.");
        }

        var entity = await dbContext.Transfers.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return AppHttpResults.NotFound("Transfer not found.", "No Transfer matched the specified identifier.");
        }

        entity.Amount = request.Amount;
        entity.CounterpartyId = request.CounterpartyId;
        entity.CurrencyId = request.CurrencyId;
        entity.Description = request.Description?.Trim() ?? string.Empty;
        entity.DueDate = request.DueDate;
        entity.Status = (TransferStatus)request.Status;
        entity.TransactionDate = request.TransactionDate;
        entity.TransferType = (TransferType)request.TransferType;
        entity.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(id);
    }
}
