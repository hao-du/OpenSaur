using OpenSaur.Brainbubby.Web.Domain.Common;

namespace OpenSaur.Brainbubby.Web.Domain;

public class User : EntityBase, IAggregateRoot
{
    public Guid WorkspaceId { get; set; }

    public string Email { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string UserSettings { get; set; } = "{}";

    public string[] Roles { get; set; } = [];

    public string[] Permissions { get; set; } = [];

    public Workspace? Workspace { get; set; }

    public ICollection<ProjectUserPermission> ProjectPermissions { get; set; } = [];
}
