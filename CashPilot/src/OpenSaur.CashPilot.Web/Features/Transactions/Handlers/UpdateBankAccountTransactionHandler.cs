using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;
using System.Security.Claims;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class UpdateBankAccountTransactionHandler
{
    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        UpdateBankAccountTransactionRequest request,
        ClaimsPrincipal user,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = ClaimHelper.GetCurrentUserId(user);

        if (request.Amount <= 0 || (request.Direction != 1 && request.Direction != 2) || request.TransactionType is < 1 or > 3)
        {
            return AppHttpResults.BadRequest("Invalid bank account transaction payload.", "Amount must be positive and enum values must be valid.");
        }

        var entity = await dbContext.BankAccountTransactions
            .Include(x => x.Transaction)
            .SingleOrDefaultAsync(x => x.Id == id && x.Transaction.OwnerId == currentUserId, cancellationToken);

        if (entity is null)
        {
            return AppHttpResults.NotFound("BankAccountTransaction not found.", "No BankAccountTransaction matched the specified identifier.");
        }

        entity.Description = request.Description?.Trim() ?? string.Empty;
        entity.IsActive = request.IsActive;
        entity.TransactionType = (BankAccountMovementType)request.TransactionType;

        entity.Transaction.Amount = request.Amount;
        entity.Transaction.CurrencyId = request.CurrencyId;
        entity.Transaction.Direction = (TransactionDirection)request.Direction;
        entity.Transaction.TransactionDate = request.TransactionDate;
        entity.Transaction.Description = request.Description?.Trim() ?? string.Empty;

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(id);
    }
}
