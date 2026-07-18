using Microsoft.AspNetCore.Identity;
using OpenSaur.Zentry.Web.Domain.Common;
using OpenSaur.Zentry.Web.Domain.Workspaces;

namespace OpenSaur.Zentry.Web.Domain.Identity;

public class ApplicationRole : IdentityRole<Guid>, IEntityBase
{
    public string Description { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public Guid CreatedBy { get; set; }

    public DateTime CreatedOn { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime? UpdatedOn { get; set; }

    public ICollection<ApplicationUserRole> UserRoles { get; set; } = [];

    public ICollection<WorkspaceRole> WorkspaceRoles { get; set; } = [];
}
