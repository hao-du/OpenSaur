using OpenSaur.Zentry.Web.Domain.Common;

namespace OpenSaur.Zentry.Web.Domain.Permissions;

public class Permission : EntityBase
{
    public string Code { get; set; } = string.Empty;

    public int Rank { get; set; }

    public Guid PermissionScopeId { get; set; }

    public string Name { get; set; } = string.Empty;

    public PermissionScope? PermissionScope { get; set; }
}
