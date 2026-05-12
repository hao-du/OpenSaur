using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Domain;

public sealed class Transfer : EntityBase
{
    public Guid CounterpartyId { get; set; }

    public Counterparty Counterparty { get; set; } = null!;

    public TransferType TransferType { get; set; }

    public decimal Amount { get; set; }

    public Guid CurrencyId { get; set; }

    public Currency Currency { get; set; } = null!;

    public DateOnly TransactionDate { get; set; }

    public DateOnly? DueDate { get; set; }

    public TransferStatus Status { get; set; } = TransferStatus.Active;

    public ICollection<TransferTransaction> TransferTransactions { get; set; } = [];
}
