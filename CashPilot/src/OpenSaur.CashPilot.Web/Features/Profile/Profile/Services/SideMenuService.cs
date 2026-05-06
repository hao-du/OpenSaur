using OpenSaur.CashPilot.Web.Features.Profile;

namespace OpenSaur.CashPilot.Web.Features.Profile.Profile.Services;

public sealed class SideMenuService
{
    public IReadOnlyList<CurrentProfileNavigationItemResponse> BuildNavigationItems(
        bool canManage)
    {
        var items = new List<CurrentProfileNavigationItemResponse>
        {
            new("dashboard", "Dashboard", "/")
        };

        if (canManage)
        {
            items.Add(new CurrentProfileNavigationItemResponse("building-2", "Banks", "/banks"));
        }

        return items;
    }
}
