namespace OpenSaur.Identity.Web.Features.Workspaces.EditWorkspace;

public sealed record EditWorkspaceRequest(
    Guid Id,
    string Name,
    string Description,
    bool IsActive,
    IReadOnlyCollection<Guid>? AssignedRoleIds = null);
