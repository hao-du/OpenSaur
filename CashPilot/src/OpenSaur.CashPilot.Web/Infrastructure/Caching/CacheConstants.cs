namespace OpenSaur.CashPilot.Web.Infrastructure.Caching;

public static class CacheConstants
{
    public const string Prefix = "CashPilot";

    public static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(5);

    public static string BanksKey(Guid userId) => $"{Prefix}:{userId}:banks";
    public static string CurrenciesKey(Guid userId) => $"{Prefix}:{userId}:currencies";
    public static string CounterpartiesKey(Guid userId) => $"{Prefix}:{userId}:counterparties";
    public static string TagsKey(Guid userId) => $"{Prefix}:{userId}:tags";
    public static string TemplatesKey(Guid userId) => $"{Prefix}:{userId}:templates";
}
