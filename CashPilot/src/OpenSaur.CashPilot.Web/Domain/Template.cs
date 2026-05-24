using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Domain;

public enum TemplateType : byte
{
    CashFlow = 1,
    Transfer = 2,
    Exchange = 3,
    BankAccount = 4
}

public sealed class Template : EntityBase
{
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public TemplateType TemplateType { get; set; }
    public string TemplateDataJson { get; set; } = "{}";
}
