using OpenSaur.Identity.Web.Domain.Common;
using OpenSaur.Identity.Web.Domain.Identity;

namespace OpenSaur.Identity.Web.Domain.Workspaces;

public class Workspace : AuditedEntity
{
    public string Name { get; set; } = string.Empty;

    public ICollection<ApplicationUser> Users { get; set; } = [];

    public ICollection<WorkspaceRole> WorkspaceRoles { get; set; } = [];
}
