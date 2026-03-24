namespace OpenSaur.Identity.Web.Tests.Permissions;

public sealed class PermissionsSliceStructureTests
{
    [Fact]
    public void PermissionsSlices_ExposeDedicatedHandlersAndAuthorizationTypes()
    {
        var assembly = typeof(Program).Assembly;

        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Permissions.GetPermissions.GetPermissionsHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Permissions.GetPermissionById.GetPermissionByIdHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.PermissionScopes.GetPermissionScopes.GetPermissionScopesHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Services.PermissionAuthorizationService"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Handlers.PermissionAuthorizationHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Requirements.PermissionAuthorizationRequirement"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Builders.PermissionEndpointConventionBuilderExtensions"));
        Assert.Null(assembly.GetType("OpenSaur.Identity.Web.Features.Permissions.Authorization.PermissionAuthorizationService"));
    }
}
