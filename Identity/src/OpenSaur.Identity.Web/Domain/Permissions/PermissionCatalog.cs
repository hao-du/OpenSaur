using System.ComponentModel;
using System.Reflection;

namespace OpenSaur.Identity.Web.Domain.Permissions;

public static class PermissionCatalog
{
    private static readonly IReadOnlyDictionary<int, PermissionDefinition> Definitions =
        CreateDefinitions();

    public static IReadOnlyCollection<PermissionDefinition> GetDefinitions() => Definitions.Values.ToArray();

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
            .Where(candidate => candidate.Family == definition.Family && candidate.Rank <= definition.Rank)
            .OrderBy(candidate => candidate.CodeId)
            .Select(candidate => candidate.CodeId)
            .ToArray();
    }

    private static IReadOnlyDictionary<int, PermissionDefinition> CreateDefinitions()
    {
        return new Dictionary<int, PermissionDefinition>
        {
            [(int)PermissionCode.Administrator_CanManage] = CreateDefinition(PermissionCode.Administrator_CanManage, "Can Manage", "Allows administrator management operations.", rank: 1)
        };
    }

    private static PermissionDefinition CreateDefinition(
        PermissionCode permissionCode,
        string name,
        string description,
        int rank)
    {
        var code = GetCanonicalCode(permissionCode);
        var family = code.Split('.', 2)[0];

        return new PermissionDefinition((int)permissionCode, code, name, description, family, rank);
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
