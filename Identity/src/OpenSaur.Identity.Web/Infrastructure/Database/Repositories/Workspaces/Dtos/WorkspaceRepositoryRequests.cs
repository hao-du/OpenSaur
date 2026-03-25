using OpenSaur.Identity.Web.Infrastructure.Security;
using OpenSaur.Identity.Web.Domain.Workspaces;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces.Dtos;

public sealed record GetAccessibleWorkspacesRequest(CurrentUserContext CurrentUserContext);

public sealed record GetAccessibleWorkspaceByIdRequest(
    Guid WorkspaceId,
    CurrentUserContext CurrentUserContext,
    bool TrackChanges = false);

public sealed record GetWorkspaceByIdRequest(Guid WorkspaceId, bool TrackChanges = false);

public sealed record GetActiveWorkspaceByIdRequest(Guid WorkspaceId, bool TrackChanges = false);

public sealed record GetWorkspacesByNameRequest(string Name, Guid? ExcludedWorkspaceId = null);

public sealed record GetAccessibleWorkspacesResponse(IReadOnlyList<Workspace> Workspaces);

public sealed record GetAccessibleWorkspaceByIdResponse(Workspace Workspace);

public sealed record GetWorkspaceByIdResponse(Workspace Workspace);

public sealed record GetActiveWorkspaceByIdResponse(Workspace Workspace);

public sealed record GetWorkspacesByNameResponse(IReadOnlyList<Workspace> Workspaces);
