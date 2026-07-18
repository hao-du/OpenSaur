using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Domain;

public sealed class BankAccountTransaction : EntityBase
{
    public Guid BankAccountId { get; set; }

    public BankAccount BankAccount { get; set; } = null!;

    public Guid TransactionId { get; set; }

    public Transaction Transaction { get; set; } = null!;

    public BankAccountMovementType TransactionType { get; set; }
}
