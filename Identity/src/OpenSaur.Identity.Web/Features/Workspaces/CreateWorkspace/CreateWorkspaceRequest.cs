namespace OpenSaur.Identity.Web.Features.Workspaces.CreateWorkspace;

public sealed record CreateWorkspaceRequest(
    string Name,
    string Description,
    IReadOnlyCollection<Guid>? AssignedRoleIds = null,
    int? MaxActiveUsers = null);
