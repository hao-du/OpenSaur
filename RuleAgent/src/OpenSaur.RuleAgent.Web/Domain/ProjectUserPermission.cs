using OpenSaur.RuleAgent.Web.Domain.Common;

namespace OpenSaur.RuleAgent.Web.Domain;

public class ProjectUserPermission : EntityBase
{
    public Guid ProjectId { get; set; }

    public Guid UserId { get; set; }

    public ProjectPermissionType Permission { get; set; } = ProjectPermissionType.CanView;

    public Project? Project { get; set; }

    public User? User { get; set; }

    public void ChangePermission(ProjectPermissionType newPermission, Guid updatedBy)
    {
        Permission = newPermission;
        UpdatedBy = updatedBy;
        UpdatedOn = DateTime.UtcNow;
    }
}
