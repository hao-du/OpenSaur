using Microsoft.AspNetCore.Identity;

namespace OpenSaur.Identity.Web.Domain.Identity;

public class ApplicationRole : IdentityRole<Guid>
{
    public string Description { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public Guid CreatedBy { get; set; }

    public DateTime CreatedOn { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime? UpdatedOn { get; set; }

    public ICollection<ApplicationUserRole> UserRoles { get; set; } = [];
}
