using OpenSaur.Identity.Web.Domain.Common;

namespace OpenSaur.Identity.Web.Domain.Permissions;

public class PermissionScope : AuditedEntity
{
    public string Name { get; set; } = string.Empty;
}
