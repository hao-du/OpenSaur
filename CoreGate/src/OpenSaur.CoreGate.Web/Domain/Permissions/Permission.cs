using OpenSaur.CoreGate.Web.Domain.Common;

namespace OpenSaur.CoreGate.Web.Domain.Permissions;

public class Permission : AuditedEntity
{
    public string Code { get; set; } = string.Empty;

    public int Rank { get; set; }

    public Guid PermissionScopeId { get; set; }

    public string Name { get; set; } = string.Empty;

    public PermissionScope? PermissionScope { get; set; }
}
