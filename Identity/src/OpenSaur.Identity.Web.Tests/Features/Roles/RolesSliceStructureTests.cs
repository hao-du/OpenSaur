namespace OpenSaur.Identity.Web.Tests.Features.Roles;

public sealed class RolesSliceStructureTests
{
    [Fact]
    public void RolesSlice_ExposesDedicatedHandlerAndContractTypes()
    {
        var assembly = typeof(Program).Assembly;

        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Roles.RoleEndpoints"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Roles.GetRoles.GetRolesHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Roles.GetRoles.GetRolesResponse"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Roles.GetRoleById.GetRoleByIdHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Roles.GetRoleById.GetRoleByIdResponse"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Roles.CreateRole.CreateRoleHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Roles.CreateRole.CreateRoleRequest"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Roles.CreateRole.CreateRoleResponse"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Roles.EditRole.EditRoleHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Roles.EditRole.EditRoleRequest"));
    }
}
