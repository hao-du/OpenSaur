using OpenSaur.CoreGate.Web.Domain.Common;

namespace OpenSaur.CoreGate.Web.Domain.Permissions;

public class PermissionScope : AuditedEntity
{
    public string Name { get; set; } = string.Empty;
}
