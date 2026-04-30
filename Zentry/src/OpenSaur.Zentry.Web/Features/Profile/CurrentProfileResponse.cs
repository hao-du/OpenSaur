namespace OpenSaur.Zentry.Web.Features.Profile;

public sealed record CurrentProfileResponse(
    string Email,
    string FirstName,
    bool IsImpersonating,
    bool IsSuperAdministrator,
    string LastName,
    IReadOnlyList<CurrentProfileNavigationItemResponse> NavigationItems,
    string UserName,
    string WorkspaceName,
    bool CanAssignUsers,
    bool CanEditRoles);

public sealed record CurrentProfileNavigationItemResponse(
    string Icon,
    string Label,
    string Path);
