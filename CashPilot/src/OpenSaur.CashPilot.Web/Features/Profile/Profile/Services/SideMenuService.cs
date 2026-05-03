using OpenSaur.CashPilot.Web.Features.Profile;

namespace OpenSaur.CashPilot.Web.Features.Profile.Profile.Services;

public sealed class SideMenuService
{
    public IReadOnlyList<CurrentProfileNavigationItemResponse> BuildNavigationItems(
        bool canManage)
    {
        if (!canManage) return [];

        var items = new List<CurrentProfileNavigationItemResponse>
        {
            new("dashboard", "Dashboard", "/")
        };

        return items;
    }
}
