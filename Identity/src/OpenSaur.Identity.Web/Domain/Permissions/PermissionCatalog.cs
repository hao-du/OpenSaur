namespace OpenSaur.Identity.Web.Domain.Permissions;

public static class PermissionCatalog
{
    private static readonly IReadOnlyDictionary<string, PermissionDefinition> Definitions =
        CreateDefinitions();

    public static IReadOnlyCollection<PermissionDefinition> GetDefinitions() => Definitions.Values
        .OrderBy(definition => definition.PermissionScopeId)
        .ThenByDescending(definition => definition.Rank)
        .ThenBy(definition => definition.Code, StringComparer.Ordinal)
        .ToArray();

    public static PermissionDefinition GetDefinition(string code)
    {
        if (!Definitions.TryGetValue(code, out var definition))
        {
            throw new KeyNotFoundException($"Permission code '{code}' is not registered.");
        }

        return definition;
    }

    private static IReadOnlyDictionary<string, PermissionDefinition> CreateDefinitions()
    {
        return new Dictionary<string, PermissionDefinition>(StringComparer.Ordinal)
        {
            [PermissionCode.Administrator_CanManage] = CreateDefinition(
                PermissionCode.Administrator_CanManage,
                PermissionScopeCatalog.AdministratorPermissionScopeId,
                "Can Manage",
                "Allows administrators to manage identity configuration and records.",
                rank: 1),
            [PermissionCode.Umbraco_CanManage] = CreateDefinition(
                PermissionCode.Umbraco_CanManage,
                PermissionScopeCatalog.UmbracoPermissionScopeId,
                "Can Manage",
                "Allows users to manage Umbraco-integrated backoffice capabilities.",
                rank: 1)
        };
    }

    private static PermissionDefinition CreateDefinition(
        string code,
        Guid permissionScopeId,
        string name,
        string description,
        int rank)
    {
        return new PermissionDefinition(code, permissionScopeId, name, description, rank);
    }
}
