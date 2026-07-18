using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Domain;

public sealed class TransferTransaction : EntityBase
{
    public Guid TransferId { get; set; }

    public Transfer Transfer { get; set; } = null!;

    public Guid TransactionId { get; set; }

    public Transaction Transaction { get; set; } = null!;
}
