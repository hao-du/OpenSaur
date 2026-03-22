namespace OpenSaur.Identity.Web.Domain.Permissions;

public sealed record PermissionDefinition(
    int CodeId,
    string Code,
    string Name,
    string Description,
    string Family,
    int Rank);
