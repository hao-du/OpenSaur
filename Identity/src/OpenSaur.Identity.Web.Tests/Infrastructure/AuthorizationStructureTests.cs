namespace OpenSaur.Identity.Web.Tests.Infrastructure;

public sealed class AuthorizationStructureTests
{
    [Fact]
    public void InfrastructureAuthorization_AndOidcTypes_LiveInDedicatedNamespaces()
    {
        var assembly = typeof(Program).Assembly;

        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.AuthorizationPolicies"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Builders.PermissionEndpointConventionBuilderExtensions"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Builders.WorkspaceEndpointConventionBuilderExtensions"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Filters.WorkspaceAccessFilter"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Handlers.PermissionAuthorizationHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Requirements.PermissionAuthorizationRequirement"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Services.PermissionAuthorizationService"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Services.UserAuthorizationService"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Oidc.OidcOptions"));
        Assert.Null(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.AuthorizationPolicies"));
        Assert.Null(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.OidcOptions"));
    }
}
