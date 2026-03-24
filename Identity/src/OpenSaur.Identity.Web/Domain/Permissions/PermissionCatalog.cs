using System.ComponentModel;
using System.Reflection;

namespace OpenSaur.Identity.Web.Domain.Permissions;

public static class PermissionCatalog
{
    private static readonly IReadOnlyDictionary<int, PermissionDefinition> Definitions =
        CreateDefinitions();

    public static IReadOnlyCollection<PermissionDefinition> GetDefinitions() => Definitions.Values
        .OrderBy(definition => definition.CodeId)
        .ToArray();

    public static PermissionDefinition GetDefinition(int codeId)
    {
        if (!Definitions.TryGetValue(codeId, out var definition))
        {
            throw new KeyNotFoundException($"Permission code '{codeId}' is not registered.");
        }

        return definition;
    }

    public static IReadOnlyCollection<int> ResolveGrantedCodeIds(int codeId)
    {
        var definition = GetDefinition(codeId);

        return Definitions.Values
            .Where(candidate => candidate.PermissionScopeId == definition.PermissionScopeId
                                && candidate.Rank <= definition.Rank)
            .OrderByDescending(candidate => candidate.Rank)
            .ThenBy(candidate => candidate.CodeId)
            .Select(candidate => candidate.CodeId)
            .ToArray();
    }

    private static IReadOnlyDictionary<int, PermissionDefinition> CreateDefinitions()
    {
        return new Dictionary<int, PermissionDefinition>
        {
            [(int)PermissionCode.Administrator_CanManage] = CreateDefinition(
                PermissionCode.Administrator_CanManage,
                PermissionScopeCatalog.AdministratorPermissionScopeId,
                "Can Manage",
                "Allows administrators to manage identity configuration and records.",
                rank: 2),
            [(int)PermissionCode.Administrator_CanView] = CreateDefinition(
                PermissionCode.Administrator_CanView,
                PermissionScopeCatalog.AdministratorPermissionScopeId,
                "Can View",
                "Allows administrators to view identity configuration and records.",
                rank: 1)
        };
    }

    private static PermissionDefinition CreateDefinition(
        PermissionCode permissionCode,
        Guid permissionScopeId,
        string name,
        string description,
        int rank)
    {
        var code = GetCanonicalCode(permissionCode);
        return new PermissionDefinition((int)permissionCode, permissionScopeId, code, name, description, rank);
    }

    private static string GetCanonicalCode(PermissionCode permissionCode)
    {
        var member = typeof(PermissionCode).GetMember(permissionCode.ToString())
            .Single();
        var attribute = member.GetCustomAttribute<DescriptionAttribute>();

        return attribute?.Description
               ?? throw new InvalidOperationException($"Permission code '{permissionCode}' is missing a Description attribute.");
    }
}
