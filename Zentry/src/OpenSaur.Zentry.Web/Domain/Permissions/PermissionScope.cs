using OpenSaur.Zentry.Web.Domain.Common;

namespace OpenSaur.Zentry.Web.Domain.Permissions;

public class PermissionScope : EntityBase
{
    public string Name { get; set; } = string.Empty;
}
