namespace OpenSaur.CashPilot.Web.Infrastructure.Lock;

public static class LockKeys
{
    public const string TokenRefreshPrefix = "lock:token:refresh:";

    public static string TokenRefresh(string userId) => $"{TokenRefreshPrefix}{userId}";
}

