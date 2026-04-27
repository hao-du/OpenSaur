namespace OpenSaur.Zentry.Web.Features.Profile;

public sealed class SideMenuService
{
    public IReadOnlyList<CurrentProfileNavigationItemResponse> BuildNavigationItems(
        bool isSuperAdministrator,
        bool canAssignUsers)
    {
        var items = new List<CurrentProfileNavigationItemResponse>
        {
            new("dashboard", "Dashboard", "/")
        };

        if (isSuperAdministrator)
        {
            items.Add(new CurrentProfileNavigationItemResponse("key-round", "OIDC Clients", "/oidc-clients"));
            items.Add(new CurrentProfileNavigationItemResponse("building-2", "Workspaces", "/workspaces"));
        }

        if (canAssignUsers)
        {
            items.Add(new CurrentProfileNavigationItemResponse("user-round", "Users", "/users"));
        }

        if (isSuperAdministrator || canAssignUsers)
        {
            items.Add(new CurrentProfileNavigationItemResponse("shield", "Roles", "/roles"));
        }

        return items;
    }
}
