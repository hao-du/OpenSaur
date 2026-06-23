using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Domain;

public sealed class PendingTransactionSubmission : IEntityBase
{
    public Guid Id { get; set; }

    public Guid OwnerId { get; set; }

    public string LocalTransactionId { get; set; } = string.Empty;

    public string PayloadJson { get; set; } = "{}";

    public Guid CreatedBy { get; set; }

    public DateTime CreatedOn { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime? UpdatedOn { get; set; }
}
