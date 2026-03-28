namespace OpenSaur.Identity.Web.Features.Roles.GetRoles;

public sealed record GetRolesResponse(Guid Id, string Name, string NormalizedName, string Description, bool IsActive);
