using Microsoft.AspNetCore.Authorization;
using OpenSaur.Identity.Web.Domain.Permissions;

namespace OpenSaur.Identity.Web.Infrastructure.Authorization.Requirements;

public sealed record PermissionAuthorizationRequirement(IReadOnlyList<PermissionCode> RequiredPermissions)
    : IAuthorizationRequirement;
