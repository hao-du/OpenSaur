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
            items.Add(new CurrentProfileNavigationItemResponse("users", "Counterparties", "/counterparties"));
            items.Add(new CurrentProfileNavigationItemResponse("coins", "Currencies", "/currencies"));
            items.Add(new CurrentProfileNavigationItemResponse("receipt-text", "Transactions", "/transactions"));
            items.Add(new CurrentProfileNavigationItemResponse("layout-template", "Templates", "/templates"));
            items.Add(new CurrentProfileNavigationItemResponse("key-round", "Tags", "/tags"));
        }

        return items;
    }
}


