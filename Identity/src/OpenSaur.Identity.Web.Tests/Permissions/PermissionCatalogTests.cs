using OpenSaur.Identity.Web.Domain.Permissions;

namespace OpenSaur.Identity.Web.Tests.Permissions;

public sealed class PermissionCatalogTests
{
    [Fact]
    public void GetDefinitions_WhenLoaded_ReturnsAdministratorScopePermissions()
    {
        var definitions = PermissionCatalog.GetDefinitions();

        Assert.Equal(2, definitions.Count);
        Assert.Contains(definitions, definition => definition.CodeId == (int)PermissionCode.Administrator_CanManage);
        Assert.Contains(definitions, definition => definition.CodeId == (int)PermissionCode.Administrator_CanView);
    }

    [Fact]
    public void GetDefinition_WhenPermissionExists_ReturnsDisplayMetadataAndScopeReference()
    {
        var definition = PermissionCatalog.GetDefinition((int)PermissionCode.Administrator_CanManage);

        Assert.Equal("Administrator.CanManage", definition.Code);
        Assert.Equal("Can Manage", definition.Name);
        Assert.False(string.IsNullOrWhiteSpace(definition.Description));
        Assert.Equal(PermissionScopeCatalog.AdministratorPermissionScopeId, definition.PermissionScopeId);
    }

    [Fact]
    public void ResolveGrantedCodeIds_WhenAdministratorCanManageGranted_ReturnsAdministratorManageAndView()
    {
        var grantedCodeIds = PermissionCatalog.ResolveGrantedCodeIds((int)PermissionCode.Administrator_CanManage);

        Assert.Equal(
            [(int)PermissionCode.Administrator_CanManage, (int)PermissionCode.Administrator_CanView],
            grantedCodeIds);
    }

    [Fact]
    public void ResolveGrantedCodeIds_WhenAdministratorCanViewGranted_DoesNotImplyCanManage()
    {
        var grantedCodeIds = PermissionCatalog.ResolveGrantedCodeIds((int)PermissionCode.Administrator_CanView);

        Assert.Equal(
            [(int)PermissionCode.Administrator_CanView],
            grantedCodeIds);
    }
}
