namespace OpenSaur.CoreGate.Web.Domain.Common;

public abstract class AuditedEntity : IAuditedRecord
{
    public Guid Id { get; set; }

    public string Description { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public Guid CreatedBy { get; set; }

    public DateTime CreatedOn { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime? UpdatedOn { get; set; }
}
