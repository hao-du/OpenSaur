namespace OpenSaur.Identity.Web.Features.Workspaces.GetWorkspaces;

public sealed record GetWorkspacesResponse(Guid Id, string Name, string Description, bool IsActive);
