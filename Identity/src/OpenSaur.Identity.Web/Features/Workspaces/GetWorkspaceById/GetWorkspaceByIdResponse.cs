namespace OpenSaur.Identity.Web.Features.Workspaces.GetWorkspaceById;

public sealed record GetWorkspaceByIdResponse(Guid Id, string Name, string Description, bool IsActive);
