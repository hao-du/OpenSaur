using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Domain;

public sealed class CurrencyExchange : EntityBase
{
    public decimal? ExchangeRate { get; set; }

    public DateOnly ExchangeDate { get; set; }

    public ICollection<CurrencyExchangeTransaction> CurrencyExchangeTransactions { get; set; } = [];
}
