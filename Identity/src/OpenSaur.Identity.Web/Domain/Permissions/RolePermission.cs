using OpenSaur.Identity.Web.Domain.Common;
using OpenSaur.Identity.Web.Domain.Identity;

namespace OpenSaur.Identity.Web.Domain.Permissions;

public class RolePermission : AuditedEntity
{
    public Guid RoleId { get; set; }

    public Guid PermissionId { get; set; }

    public ApplicationRole? Role { get; set; }

    public Permission? Permission { get; set; }
}
