using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Domain;

public sealed class CashFlow : EntityBase
{
    public Guid TransactionId { get; set; }

    public Transaction Transaction { get; set; } = null!;
}
