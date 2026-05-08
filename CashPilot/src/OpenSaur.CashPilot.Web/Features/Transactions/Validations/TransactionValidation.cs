using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Handlers;

internal static class TransactionValidation
{
    public static string? ValidateCashFlow(UpsertCashFlowRequest request)
    {
        if (request.Amount <= 0)
        {
            return "Amount must be greater than zero.";
        }

        if (request.CurrencyId == Guid.Empty)
        {
            return "Currency is required.";
        }

        if (request.TransactedOn == default)
        {
            return "Transaction date is required.";
        }

        if (request.Description is not null && request.Description.Trim().Length > 500)
        {
            return "Description cannot exceed 500 characters.";
        }

        return null;
    }
}
