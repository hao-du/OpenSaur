namespace OpenSaur.Zentry.Web.Features.Workspaces.GetWorkspaceById;

public sealed record GetWorkspaceByIdResponse(
    Guid Id,
    string Name,
    string Description,
    bool IsActive,
    IReadOnlyList<Guid> AssignedRoleIds,
    int? MaxActiveUsers);
