using OpenSaur.Zentry.Web.Domain.Common;
using OpenSaur.Zentry.Web.Domain.Identity;

namespace OpenSaur.Zentry.Web.Domain.Permissions;

public class RolePermission : EntityBase
{
    public Guid RoleId { get; set; }

    public Guid PermissionId { get; set; }

    public ApplicationRole? Role { get; set; }

    public Permission? Permission { get; set; }
}
