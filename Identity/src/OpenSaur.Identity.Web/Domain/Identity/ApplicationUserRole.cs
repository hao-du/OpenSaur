using Microsoft.AspNetCore.Identity;
using OpenSaur.Identity.Web.Domain.Common;

namespace OpenSaur.Identity.Web.Domain.Identity;

public class ApplicationUserRole : IdentityUserRole<Guid>, IAuditedRecord
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
