using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

public static class UpdateBankAccountHandler
{
    public static async Task<Results<Ok<Guid>, BadRequest<ProblemDetails>, NotFound<ProblemDetails>>> HandleAsync(
        Guid id,
        UpdateBankAccountRequest request,
        CashPilotDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (request.Amount <= 0 || request.InterestRate < 0 || request.MaturityDate < request.StartDate || request.Status is < 1 or > 3)
        {
            return AppHttpResults.BadRequest("Invalid bank account payload.", "Invalid amount, interest rate, date range, or status.");
        }

        var entity = await dbContext.BankAccounts.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return AppHttpResults.NotFound("BankAccount not found.", "No BankAccount matched the specified identifier.");
        }

        entity.AccountNumber = request.AccountNumber?.Trim();
        entity.Amount = request.Amount;
        entity.BankId = request.BankId;
        entity.CurrencyId = request.CurrencyId;
        entity.Description = request.Description?.Trim() ?? string.Empty;
        entity.InterestRate = request.InterestRate;
        entity.MaturityDate = request.MaturityDate;
        entity.StartDate = request.StartDate;
        entity.Status = (BankAccountStatus)request.Status;
        entity.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(id);
    }
}
