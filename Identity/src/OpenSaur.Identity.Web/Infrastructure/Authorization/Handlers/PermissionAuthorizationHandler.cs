using Microsoft.AspNetCore.Authorization;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Requirements;
using OpenSaur.Identity.Web.Infrastructure.Authorization.Services;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Infrastructure.Authorization.Handlers;

public sealed class PermissionAuthorizationHandler
    : AuthorizationHandler<PermissionAuthorizationRequirement>
{
    private readonly PermissionAuthorizationService _permissionAuthorizationService;

    public PermissionAuthorizationHandler(PermissionAuthorizationService permissionAuthorizationService)
    {
        _permissionAuthorizationService = permissionAuthorizationService;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionAuthorizationRequirement requirement)
    {
        var currentUserContext = CurrentUserContext.Create(context.User);
        if (currentUserContext is null)
        {
            return;
        }

        var permissions = await _permissionAuthorizationService.HasPermissionsAsync(
            currentUserContext.UserId,
            requirement.RequiredPermissions.ToArray(),
            CancellationToken.None);

        if (requirement.RequiredPermissions.All(permission => permissions[permission]))
        {
            context.Succeed(requirement);
        }
    }
}
