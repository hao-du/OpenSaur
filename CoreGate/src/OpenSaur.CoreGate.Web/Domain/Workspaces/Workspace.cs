using OpenSaur.CoreGate.Web.Domain.Common;
using OpenSaur.CoreGate.Web.Domain.Identity;

namespace OpenSaur.CoreGate.Web.Domain.Workspaces;

public class Workspace : AuditedEntity
{
    public string Name { get; set; } = string.Empty;

    public int? MaxActiveUsers { get; set; }

    public ICollection<ApplicationUser> Users { get; set; } = [];

    public ICollection<WorkspaceRole> WorkspaceRoles { get; set; } = [];
}
