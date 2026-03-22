using OpenSaur.Identity.Web.Domain.Permissions;

namespace OpenSaur.Identity.Web.Tests.Permissions;

public sealed class PermissionCatalogTests
{
    [Fact]
    public void GetDefinitions_WhenLoaded_ReturnsOnlyAdministratorCanManage()
    {
        var definitions = PermissionCatalog.GetDefinitions();

        var definition = Assert.Single(definitions);
        Assert.Equal((int)PermissionCode.Administrator_CanManage, definition.CodeId);
        Assert.Equal("Administrator.CanManage", definition.Code);
    }

    [Fact]
    public void GetDefinition_WhenPermissionExists_ReturnsDisplayMetadataAndCanonicalCode()
    {
        var definition = PermissionCatalog.GetDefinition((int)PermissionCode.Administrator_CanManage);

        Assert.Equal("Administrator.CanManage", definition.Code);
        Assert.Equal("Can Manage", definition.Name);
        Assert.False(string.IsNullOrWhiteSpace(definition.Description));
    }

    [Fact]
    public void ResolveGrantedCodeIds_WhenAdministratorCanManageGranted_ReturnsOnlyAdministratorCanManage()
    {
        var grantedCodeIds = PermissionCatalog.ResolveGrantedCodeIds((int)PermissionCode.Administrator_CanManage);

        Assert.Equal(
            [(int)PermissionCode.Administrator_CanManage],
            grantedCodeIds);
    }
}
