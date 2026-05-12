using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Domain;

public sealed class CurrencyExchangeTransaction : EntityBase
{
    public Guid CurrencyExchangeId { get; set; }

    public CurrencyExchange CurrencyExchange { get; set; } = null!;

    public Guid TransactionId { get; set; }

    public Transaction Transaction { get; set; } = null!;
}
