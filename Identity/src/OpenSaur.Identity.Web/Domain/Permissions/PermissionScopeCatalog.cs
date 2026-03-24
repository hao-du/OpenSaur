namespace OpenSaur.Identity.Web.Domain.Permissions;

public static class PermissionScopeCatalog
{
    public static Guid AdministratorPermissionScopeId { get; } =
        Guid.Parse("7284f832-b4f0-4508-9c96-98ce6f87db6d");

    private static readonly IReadOnlyDictionary<Guid, PermissionScopeDefinition> Definitions =
        CreateDefinitions();

    public static IReadOnlyCollection<PermissionScopeDefinition> GetDefinitions() => Definitions.Values
        .OrderBy(definition => definition.Name)
        .ToArray();

    public static PermissionScopeDefinition GetDefinition(Guid permissionScopeId)
    {
        if (!Definitions.TryGetValue(permissionScopeId, out var definition))
        {
            throw new KeyNotFoundException($"Permission scope '{permissionScopeId}' is not registered.");
        }

        return definition;
    }

    private static IReadOnlyDictionary<Guid, PermissionScopeDefinition> CreateDefinitions()
    {
        return new Dictionary<Guid, PermissionScopeDefinition>
        {
            [AdministratorPermissionScopeId] = new(
                AdministratorPermissionScopeId,
                "Administrator",
                "Administrative capabilities for managing the identity service.")
        };
    }
}
