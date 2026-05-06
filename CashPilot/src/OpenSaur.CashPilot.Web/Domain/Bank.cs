using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Domain;

public sealed class Bank : IEntityBase
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ShortName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsDefault { get; set; }

    public Guid CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; }
    public Guid? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public bool IsActive { get; set; } = true;
}

