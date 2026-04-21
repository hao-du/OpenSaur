using OpenSaur.Zentry.Web.Domain.Common;
using OpenSaur.Zentry.Web.Domain.Identity;

namespace OpenSaur.Zentry.Web.Domain.Workspaces;

public class Workspace : EntityBase
{
    public string Name { get; set; } = string.Empty;

    public int? MaxActiveUsers { get; set; }

    public ICollection<ApplicationUser> Users { get; set; } = [];

    public ICollection<WorkspaceRole> WorkspaceRoles { get; set; } = [];
}
