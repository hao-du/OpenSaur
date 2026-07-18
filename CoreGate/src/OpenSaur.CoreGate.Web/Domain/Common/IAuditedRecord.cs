namespace OpenSaur.CoreGate.Web.Domain.Common;

public interface IAuditedRecord
{
    Guid Id { get; set; }

    Guid CreatedBy { get; set; }

    DateTime CreatedOn { get; set; }

    Guid? UpdatedBy { get; set; }

    DateTime? UpdatedOn { get; set; }
}
