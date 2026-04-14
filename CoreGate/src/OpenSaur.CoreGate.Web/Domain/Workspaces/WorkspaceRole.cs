using OpenSaur.CoreGate.Web.Domain.Common;
using OpenSaur.CoreGate.Web.Domain.Identity;

namespace OpenSaur.CoreGate.Web.Domain.Workspaces;

public sealed class WorkspaceRole : AuditedEntity
{
    public Guid WorkspaceId { get; set; }

    public Workspace? Workspace { get; set; }

    public Guid RoleId { get; set; }

    public ApplicationRole? Role { get; set; }
}
