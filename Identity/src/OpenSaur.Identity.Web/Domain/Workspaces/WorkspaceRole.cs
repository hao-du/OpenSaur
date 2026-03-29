using OpenSaur.Identity.Web.Domain.Common;
using OpenSaur.Identity.Web.Domain.Identity;

namespace OpenSaur.Identity.Web.Domain.Workspaces;

public sealed class WorkspaceRole : AuditedEntity
{
    public Guid WorkspaceId { get; set; }

    public Workspace? Workspace { get; set; }

    public Guid RoleId { get; set; }

    public ApplicationRole? Role { get; set; }
}
