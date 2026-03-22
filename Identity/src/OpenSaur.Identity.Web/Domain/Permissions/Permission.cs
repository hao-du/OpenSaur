using OpenSaur.Identity.Web.Domain.Common;

namespace OpenSaur.Identity.Web.Domain.Permissions;

public class Permission : AuditedEntity
{
    public int CodeId { get; set; }

    public string Name { get; set; } = string.Empty;
}
