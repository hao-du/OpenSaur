using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Common;
using OpenSaur.Identity.Web.Domain.Workspaces;

namespace OpenSaur.Identity.Web.Domain.Identity;

public class ApplicationUser : IdentityUser<Guid>, IAuditedRecord
{
    public string Description { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public bool RequirePasswordChange { get; set; } = true;

    public Guid WorkspaceId { get; set; }

    public string UserSettings { get; set; } = "{}";

    public Guid CreatedBy { get; set; }

    public DateTime CreatedOn { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime? UpdatedOn { get; set; }

    public Workspace? Workspace { get; set; }

    public ICollection<ApplicationUserRole> UserRoles { get; set; } = [];
}
