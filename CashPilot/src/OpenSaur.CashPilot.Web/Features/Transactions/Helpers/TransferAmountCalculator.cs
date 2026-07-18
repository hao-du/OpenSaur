using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Helpers;

internal static class TransferAmountCalculator
{
    public static decimal CalculateAmount(IReadOnlyList<SaveTransferDetailRequest> details)
    {
        return CalculateAmount(details.Select(detail => (detail.Amount, detail.Direction)));
    }

    public static decimal CalculateAmount(IReadOnlyList<TransferFormDetailResponse> details)
    {
        return CalculateAmount(details.Select(detail => (detail.Amount, detail.Direction)));
    }

    private static decimal CalculateAmount(IEnumerable<(decimal Amount, byte Direction)> details)
    {
        var netAmount = details.Sum(detail =>
            detail.Direction == (byte)TransactionDirection.In ? detail.Amount : -detail.Amount);

        return Math.Abs(netAmount);
    }
}
