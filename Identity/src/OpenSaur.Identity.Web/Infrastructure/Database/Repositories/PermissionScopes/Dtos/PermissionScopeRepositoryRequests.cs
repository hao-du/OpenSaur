using OpenSaur.Identity.Web.Domain.Permissions;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Repositories.PermissionScopes.Dtos;

public sealed record GetPermissionScopesRequest;

public sealed record GetPermissionScopesResponse(IReadOnlyList<PermissionScope> PermissionScopes);
