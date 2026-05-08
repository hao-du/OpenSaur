using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Domain;

public sealed class Transaction : IEntityBase
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public Guid CurrencyId { get; set; }
    public Currency Currency { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime TransactedOn { get; set; }
    public ICollection<CashFlow> CashFlows { get; set; } = new List<CashFlow>();

    public Guid CreatedBy { get; set; }
    public DateTime CreatedOn { get; set; }
    public Guid? UpdatedBy { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public bool IsActive { get; set; } = true;
}
