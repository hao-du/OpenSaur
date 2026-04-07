using Microsoft.AspNetCore.Authorization;
namespace OpenSaur.Identity.Web.Infrastructure.Authorization.Requirements;

public sealed record PermissionAuthorizationRequirement(IReadOnlyList<string> RequiredPermissions)
    : IAuthorizationRequirement;
