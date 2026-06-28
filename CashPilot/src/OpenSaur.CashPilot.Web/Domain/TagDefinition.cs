using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Domain;

public sealed class TagDefinition : EntityBase
{
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string MatchingTerms { get; set; } = "[]";
    public bool Marker { get; set; }
    public bool IsDefaultMaker { get; set; }
}
