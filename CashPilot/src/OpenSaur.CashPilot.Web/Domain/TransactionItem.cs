using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Domain;

public sealed class TransactionItem : EntityBase
{
    public string Name { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public Guid? CashFlowId { get; set; }

    public CashFlow? CashFlow { get; set; }

    public Guid? BankAccountId { get; set; }

    public BankAccount? BankAccount { get; set; }

    public Guid? TransferId { get; set; }

    public Transfer? Transfer { get; set; }

    public Guid? CurrencyExchangeId { get; set; }

    public CurrencyExchange? CurrencyExchange { get; set; }
}
