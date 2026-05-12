using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Domain;

public sealed class Transaction : EntityBase
{
    public Guid CurrencyId { get; set; }

    public Currency Currency { get; set; } = null!;

    public decimal Amount { get; set; }

    public TransactionDirection Direction { get; set; }

    public DateOnly TransactionDate { get; set; }

    public ICollection<CashFlow> CashFlows { get; set; } = [];

    public ICollection<BankAccountTransaction> BankAccountTransactions { get; set; } = [];

    public ICollection<TransferTransaction> TransferTransactions { get; set; } = [];

    public ICollection<CurrencyExchangeTransaction> CurrencyExchangeTransactions { get; set; } = [];
}
