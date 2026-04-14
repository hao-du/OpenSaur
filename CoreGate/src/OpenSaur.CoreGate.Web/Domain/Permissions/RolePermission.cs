using OpenSaur.CoreGate.Web.Domain.Common;
using OpenSaur.CoreGate.Web.Domain.Identity;

namespace OpenSaur.CoreGate.Web.Domain.Permissions;

public class RolePermission : AuditedEntity
{
    public Guid RoleId { get; set; }

    public Guid PermissionId { get; set; }

    public ApplicationRole? Role { get; set; }

    public Permission? Permission { get; set; }
}
