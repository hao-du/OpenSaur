using OpenSaur.Zentry.Web.Domain.Common;
using OpenSaur.Zentry.Web.Domain.Identity;

namespace OpenSaur.Zentry.Web.Domain.Workspaces;

public sealed class WorkspaceRole : EntityBase
{
    public Guid WorkspaceId { get; set; }

    public Workspace? Workspace { get; set; }

    public Guid RoleId { get; set; }

    public ApplicationRole? Role { get; set; }
}
