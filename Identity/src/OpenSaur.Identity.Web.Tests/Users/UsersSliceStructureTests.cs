namespace OpenSaur.Identity.Web.Tests.Users;

public sealed class UsersSliceStructureTests
{
    [Fact]
    public void UsersSlice_ExposesDedicatedHandlerAndAuthorizationSupportTypes()
    {
        var assembly = typeof(Program).Assembly;

        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Users.GetUsers.GetUsersHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Users.GetUserById.GetUserByIdHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Users.CreateUser.CreateUserHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Users.EditUser.EditUserHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Users.ChangeUserPassword.ChangeUserPasswordHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Users.ChangeWorkspace.ChangeUserWorkspaceHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Security.CurrentUserContext"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Requirements.PermissionAuthorizationRequirement"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Handlers.PermissionAuthorizationHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Builders.PermissionEndpointConventionBuilderExtensions"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Filters.WorkspaceAccessFilter"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Builders.WorkspaceEndpointConventionBuilderExtensions"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Services.UserAuthorizationService"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.AuthorizationPolicies"));
        Assert.Null(assembly.GetType("OpenSaur.Identity.Web.Features.Permissions.Authorization.PermissionAuthorizationRequirement"));
        Assert.Null(assembly.GetType("OpenSaur.Identity.Web.Features.Permissions.Authorization.PermissionAuthorizationHandler"));
        Assert.Null(assembly.GetType("OpenSaur.Identity.Web.Features.Permissions.Authorization.PermissionEndpointConventionBuilderExtensions"));
        Assert.Null(assembly.GetType("OpenSaur.Identity.Web.Features.Users.Authorization.WorkspaceAccessFilter"));
        Assert.Null(assembly.GetType("OpenSaur.Identity.Web.Features.Users.Authorization.WorkspaceEndpointConventionBuilderExtensions"));
        Assert.Null(assembly.GetType("OpenSaur.Identity.Web.Features.Users.UserAuthorizationService"));
        Assert.Null(assembly.GetType("OpenSaur.Identity.Web.Features.Users.UserWorkspaceAccessResolvers"));
    }

    [Fact]
    public void UsersSlice_CreateAndEditContracts_DoNotExposeWorkspaceId()
    {
        var assembly = typeof(Program).Assembly;

        var createRequestType = assembly.GetType("OpenSaur.Identity.Web.Features.Users.CreateUser.CreateUserRequest");
        var editRequestType = assembly.GetType("OpenSaur.Identity.Web.Features.Users.EditUser.EditUserRequest");

        Assert.NotNull(createRequestType);
        Assert.NotNull(editRequestType);
        Assert.Null(createRequestType!.GetProperty("WorkspaceId"));
        Assert.Null(editRequestType!.GetProperty("WorkspaceId"));
    }

    [Fact]
    public void UsersSlice_TargetUserHandlers_DoNotDependOnUserAuthorizationService()
    {
        var assembly = typeof(Program).Assembly;
        var userAuthorizationServiceType = assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Authorization.Services.UserAuthorizationService");

        Assert.NotNull(userAuthorizationServiceType);
        Assert.DoesNotContain(
            GetHandleAsyncParameters(assembly, "OpenSaur.Identity.Web.Features.Users.GetUserById.GetUserByIdHandler"),
            parameter => parameter.ParameterType == userAuthorizationServiceType);
        Assert.DoesNotContain(
            GetHandleAsyncParameters(assembly, "OpenSaur.Identity.Web.Features.Users.EditUser.EditUserHandler"),
            parameter => parameter.ParameterType == userAuthorizationServiceType);
        Assert.DoesNotContain(
            GetHandleAsyncParameters(assembly, "OpenSaur.Identity.Web.Features.Users.ChangeUserPassword.ChangeUserPasswordHandler"),
            parameter => parameter.ParameterType == userAuthorizationServiceType);
    }

    private static IReadOnlyList<System.Reflection.ParameterInfo> GetHandleAsyncParameters(
        System.Reflection.Assembly assembly,
        string typeName)
    {
        var type = assembly.GetType(typeName);
        Assert.NotNull(type);

        var method = type!.GetMethod("HandleAsync");
        Assert.NotNull(method);

        return method!.GetParameters();
    }
}
