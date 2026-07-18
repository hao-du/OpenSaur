namespace OpenSaur.CashPilot.Web.Features.Profile;

public sealed record CurrentProfileResponse(
    string Id,
    string Email,
    string FirstName,
    bool IsImpersonating,
    bool IsSuperAdministrator,
    string LastName,
    IReadOnlyList<CurrentProfileNavigationItemResponse> NavigationItems,
    IReadOnlyList<string> Roles,
    string UserName,
    string WorkspaceName,
    bool CanManage);

public sealed record CurrentProfileNavigationItemResponse(
    string Icon,
    string Label,
    string Path);
