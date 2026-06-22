using System.Security.Claims;
using OpenSaur.CashPilot.Web.Infrastructure;

namespace OpenSaur.CashPilot.Web.Features.PendingTransactions.Handlers;

internal static class PendingTransactionSyncHelper
{
    public static ClaimsPrincipal CreateUserPrincipal(Guid userId)
    {
        return new ClaimsPrincipal(new ClaimsIdentity(
            [
                new Claim(Constants.ClaimTypes.Subject, userId.ToString())
            ],
            authenticationType: "PendingTransactionSync"));
    }
}
