using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Features.Transactions.Dtos;

namespace OpenSaur.CashPilot.Web.Features.Transactions.Helpers;

internal static class TransactionItemMappingExtensions
{
    public static ICollection<TransactionItem> ToTransactionItems(
        this IEnumerable<TransactionItemRequest> items)
    {
        return items
            .Where(x => !string.IsNullOrWhiteSpace(x.Name))
            .Select(x => new TransactionItem
            {
                Name = x.Name.Trim(),
                Amount = x.Amount
            })
            .ToList();
    }
}
