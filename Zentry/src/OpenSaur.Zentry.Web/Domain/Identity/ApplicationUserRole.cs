using Microsoft.AspNetCore.Identity;
using OpenSaur.Zentry.Web.Domain.Common;

namespace OpenSaur.Zentry.Web.Domain.Identity;

public class ApplicationUserRole : IdentityUserRole<Guid>, IEntityBase
{
    public Guid Id { get; set; }

    public string Description { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public Guid CreatedBy { get; set; }

    public DateTime CreatedOn { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime? UpdatedOn { get; set; }

    public ApplicationUser? User { get; set; }

    public ApplicationRole? Role { get; set; }
}
