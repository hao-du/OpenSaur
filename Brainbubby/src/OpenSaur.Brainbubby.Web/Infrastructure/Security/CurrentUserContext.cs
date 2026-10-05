namespace OpenSaur.Brainbubby.Web.Infrastructure.Security;

public sealed record CurrentUserContext(
    Guid? UserId,
    string? Email,
    Guid? WorkspaceId,
    bool IsSuperAdministrator,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions)
{
    public bool IsAuthenticated => UserId.HasValue || !string.IsNullOrWhiteSpace(Email);
}
