namespace OpenSaur.Zentry.Web.Features.Workspaces.GetWorkspaces;

public sealed record GetWorkspacesResponse(
    Guid Id,
    string Name,
    string Description,
    bool IsActive,
    IReadOnlyList<Guid> AssignedRoleIds,
    int? MaxActiveUsers);
