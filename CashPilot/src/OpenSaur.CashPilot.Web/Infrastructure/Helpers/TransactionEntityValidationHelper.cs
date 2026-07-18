using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Infrastructure.Validation;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using AppHttpResults = OpenSaur.CashPilot.Web.Infrastructure.Http.HttpResults;

namespace OpenSaur.CashPilot.Web.Infrastructure.Helpers;

internal static class TransactionEntityValidationHelper
{
    public static async Task<BadRequest<ProblemDetails>?> EnsureCurrencyExistsAsync(
        CashPilotDbContext dbContext,
        Guid currentUserId,
        Guid currencyId,
        CancellationToken cancellationToken)
    {
        var hasCurrency = await dbContext.Currencies
            .AnyAsync(x => x.Id == currencyId && x.OwnerId == currentUserId && x.IsActive, cancellationToken);
        return hasCurrency
            ? null
            : AppHttpResults.BadRequest(
                TransactionValidationMessages.CurrencyInvalidTitle,
                TransactionValidationMessages.CurrencyInvalidDetail);
    }

    public static async Task<BadRequest<ProblemDetails>?> EnsureCurrenciesExistAsync(
        CashPilotDbContext dbContext,
        Guid currentUserId,
        IReadOnlyCollection<Guid> currencyIds,
        CancellationToken cancellationToken)
    {
        var distinctCurrencyIds = currencyIds.Where(x => x != Guid.Empty).Distinct().ToList();
        if (distinctCurrencyIds.Count == 0)
        {
            return AppHttpResults.BadRequest(
                TransactionValidationMessages.CurrencyInvalidTitle,
                TransactionValidationMessages.CurrenciesInvalidDetail);
        }

        var currencyCount = await dbContext.Currencies
            .CountAsync(x => distinctCurrencyIds.Contains(x.Id) && x.OwnerId == currentUserId && x.IsActive, cancellationToken);
        return currencyCount == distinctCurrencyIds.Count
            ? null
            : AppHttpResults.BadRequest(
                TransactionValidationMessages.CurrencyInvalidTitle,
                TransactionValidationMessages.CurrenciesInvalidDetail);
    }

    public static async Task<BadRequest<ProblemDetails>?> EnsureBankExistsAsync(
        CashPilotDbContext dbContext,
        Guid currentUserId,
        Guid bankId,
        CancellationToken cancellationToken)
    {
        var hasBank = await dbContext.Banks
            .AnyAsync(x => x.Id == bankId && x.OwnerId == currentUserId && x.IsActive, cancellationToken);
        return hasBank
            ? null
            : AppHttpResults.BadRequest(
                TransactionValidationMessages.BankInvalidTitle,
                TransactionValidationMessages.BankInvalidDetail);
    }

    public static async Task<BadRequest<ProblemDetails>?> EnsureCounterpartyExistsAsync(
        CashPilotDbContext dbContext,
        Guid currentUserId,
        Guid counterpartyId,
        CancellationToken cancellationToken)
    {
        var hasCounterparty = await dbContext.Counterparties
            .AnyAsync(x => x.Id == counterpartyId && x.OwnerId == currentUserId && x.IsActive, cancellationToken);
        return hasCounterparty
            ? null
            : AppHttpResults.BadRequest(
                TransactionValidationMessages.CounterpartyInvalidTitle,
                TransactionValidationMessages.CounterpartyInvalidDetail);
    }
}

