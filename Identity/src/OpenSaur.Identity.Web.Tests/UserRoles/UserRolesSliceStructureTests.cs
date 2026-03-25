namespace OpenSaur.Identity.Web.Tests.UserRoles;

public sealed class UserRolesSliceStructureTests
{
    [Fact]
    public void UserRolesSlice_ExposesDedicatedEndpointHandlerAndContractTypes()
    {
        var assembly = typeof(Program).Assembly;

        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.UserRoles.UserRoleEndpoints"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.UserRoles.GetUserRoles.GetUserRolesHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.UserRoles.GetUserRoles.GetUserRolesResponse"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.UserRoles.CreateUserRole.CreateUserRoleHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.UserRoles.CreateUserRole.CreateUserRoleRequest"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.UserRoles.CreateUserRole.CreateUserRoleResponse"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.UserRoles.EditUserRole.EditUserRoleHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.UserRoles.EditUserRole.EditUserRoleRequest"));
    }
}
