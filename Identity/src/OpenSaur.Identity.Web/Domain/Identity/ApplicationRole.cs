using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Common;
using OpenSaur.Identity.Web.Domain.Workspaces;

namespace OpenSaur.Identity.Web.Domain.Identity;

public class ApplicationRole : IdentityRole<Guid>, IAuditedRecord
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
