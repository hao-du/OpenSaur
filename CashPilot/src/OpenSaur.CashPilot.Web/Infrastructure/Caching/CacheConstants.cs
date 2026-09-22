namespace OpenSaur.CashPilot.Web.Infrastructure.Caching;

public static class CacheConstants
{
    public const string Prefix = "CashPilot";

    public static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(5);
    public static readonly TimeSpan ShortTtl = TimeSpan.FromSeconds(60);

    // Profile & Settings
    public static string ProfileKey(Guid userId) => $"{Prefix}:{userId}:profile";

    // Master Data (Filter-aware)
    public static string BanksKey(Guid userId, bool? isActive = null, string? name = null, string? shortName = null)
    {
        var activePart = isActive.HasValue ? $":act={isActive.Value}" : ":act=all";
        var namePart = !string.IsNullOrWhiteSpace(name) ? $":n={name.Trim().ToLowerInvariant()}" : string.Empty;
        var shortNamePart = !string.IsNullOrWhiteSpace(shortName) ? $":sn={shortName.Trim().ToLowerInvariant()}" : string.Empty;
        return $"{Prefix}:{userId}:banks{activePart}{namePart}{shortNamePart}";
    }

    public static string CurrenciesKey(Guid userId, bool? isActive = null, string? name = null, string? shortName = null)
    {
        var activePart = isActive.HasValue ? $":act={isActive.Value}" : ":act=all";
        var namePart = !string.IsNullOrWhiteSpace(name) ? $":n={name.Trim().ToLowerInvariant()}" : string.Empty;
        var shortNamePart = !string.IsNullOrWhiteSpace(shortName) ? $":sn={shortName.Trim().ToLowerInvariant()}" : string.Empty;
        return $"{Prefix}:{userId}:currencies{activePart}{namePart}{shortNamePart}";
    }

    public static string CounterpartiesKey(Guid userId, bool? isActive = null, string? fullName = null, string? email = null, string? phoneNumber = null)
    {
        var activePart = isActive.HasValue ? $":act={isActive.Value}" : ":act=all";
        var namePart = !string.IsNullOrWhiteSpace(fullName) ? $":fn={fullName.Trim().ToLowerInvariant()}" : string.Empty;
        var emailPart = !string.IsNullOrWhiteSpace(email) ? $":em={email.Trim().ToLowerInvariant()}" : string.Empty;
        var phonePart = !string.IsNullOrWhiteSpace(phoneNumber) ? $":ph={phoneNumber.Trim()}" : string.Empty;
        return $"{Prefix}:{userId}:counterparties{activePart}{namePart}{emailPart}{phonePart}";
    }

    public static string TagsKey(Guid userId, bool? isActive = null, string? name = null)
    {
        var activePart = isActive.HasValue ? $":act={isActive.Value}" : ":act=all";
        var namePart = !string.IsNullOrWhiteSpace(name) ? $":n={name.Trim().ToLowerInvariant()}" : string.Empty;
        return $"{Prefix}:{userId}:tags{activePart}{namePart}";
    }

    public static string TemplatesKey(Guid userId, bool? isActive = null, string? name = null, int? templateType = null, bool getDetail = false)
    {
        var activePart = isActive.HasValue ? $":act={isActive.Value}" : ":act=all";
        var namePart = !string.IsNullOrWhiteSpace(name) ? $":n={name.Trim().ToLowerInvariant()}" : string.Empty;
        var typePart = templateType.HasValue ? $":t={templateType.Value}" : string.Empty;
        var detailPart = getDetail ? ":d=1" : string.Empty;
        return $"{Prefix}:{userId}:templates{activePart}{namePart}{typePart}{detailPart}";
    }

    // Dashboard Analytics & Balances
    public static string CurrencyBalancesKey(Guid userId) => $"{Prefix}:{userId}:dashboard:balances";
    public static string ActiveBankBalancesKey(Guid userId) => $"{Prefix}:{userId}:dashboard:bank-balances";
    public static string MarkerPeriodsKey(Guid userId, Guid markerId) => $"{Prefix}:{userId}:dashboard:marker-periods:{markerId}";
    public static string IncomeOutcomeLatestPeriodsKey(Guid userId, bool isMonthly) => $"{Prefix}:{userId}:dashboard:income-outcome:{isMonthly}";

    // Reports
    public static string ReportIncomeOutcomeKey(Guid userId, int year, string? currencyId = null, string? tag = null)
    {
        var curr = !string.IsNullOrWhiteSpace(currencyId) ? currencyId.Trim() : "default";
        var t = !string.IsNullOrWhiteSpace(tag) ? tag.Trim().ToLowerInvariant() : "all";
        return $"{Prefix}:{userId}:report:income-outcome:{year}:{curr}:{t}";
    }
}
