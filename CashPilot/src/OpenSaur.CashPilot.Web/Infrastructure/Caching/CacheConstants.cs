namespace OpenSaur.CashPilot.Web.Infrastructure.Caching;

public static class CacheConstants
{
    public static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(5);
    public static readonly TimeSpan ShortTtl = TimeSpan.FromSeconds(60);

    // Profile & Settings
    public static string ProfileKey(Guid userId) => $"{userId}:profile";

    // Master Data Version Keys (Incremented or changed on any mutation to invalidate all filter variations)
    public static string BanksVersionKey(Guid userId) => $"{userId}:banks:version";
    public static string CurrenciesVersionKey(Guid userId) => $"{userId}:currencies:version";
    public static string CounterpartiesVersionKey(Guid userId) => $"{userId}:counterparties:version";
    public static string TagsVersionKey(Guid userId) => $"{userId}:tags:version";
    public static string TemplatesVersionKey(Guid userId) => $"{userId}:templates:version";

    // Master Data (Filter & Version-aware)
    public static string BanksKey(Guid userId, string version = "v0", bool? isActive = null, string? name = null, string? shortName = null)
    {
        var activePart = isActive.HasValue ? $":act={isActive.Value}" : ":act=all";
        var namePart = !string.IsNullOrWhiteSpace(name) ? $":n={name.Trim().ToLowerInvariant()}" : string.Empty;
        var shortNamePart = !string.IsNullOrWhiteSpace(shortName) ? $":sn={shortName.Trim().ToLowerInvariant()}" : string.Empty;
        return $"{userId}:banks:{version}{activePart}{namePart}{shortNamePart}";
    }

    public static string CurrenciesKey(Guid userId, string version = "v0", bool? isActive = null, string? name = null, string? shortName = null)
    {
        var activePart = isActive.HasValue ? $":act={isActive.Value}" : ":act=all";
        var namePart = !string.IsNullOrWhiteSpace(name) ? $":n={name.Trim().ToLowerInvariant()}" : string.Empty;
        var shortNamePart = !string.IsNullOrWhiteSpace(shortName) ? $":sn={shortName.Trim().ToLowerInvariant()}" : string.Empty;
        return $"{userId}:currencies:{version}{activePart}{namePart}{shortNamePart}";
    }

    public static string CounterpartiesKey(Guid userId, string version = "v0", bool? isActive = null, string? fullName = null, string? email = null, string? phoneNumber = null)
    {
        var activePart = isActive.HasValue ? $":act={isActive.Value}" : ":act=all";
        var namePart = !string.IsNullOrWhiteSpace(fullName) ? $":fn={fullName.Trim().ToLowerInvariant()}" : string.Empty;
        var emailPart = !string.IsNullOrWhiteSpace(email) ? $":em={email.Trim().ToLowerInvariant()}" : string.Empty;
        var phonePart = !string.IsNullOrWhiteSpace(phoneNumber) ? $":ph={phoneNumber.Trim()}" : string.Empty;
        return $"{userId}:counterparties:{version}{activePart}{namePart}{emailPart}{phonePart}";
    }

    public static string TagsKey(Guid userId, string version = "v0", bool? isActive = null, string? name = null)
    {
        var activePart = isActive.HasValue ? $":act={isActive.Value}" : ":act=all";
        var namePart = !string.IsNullOrWhiteSpace(name) ? $":n={name.Trim().ToLowerInvariant()}" : string.Empty;
        return $"{userId}:tags:{version}{activePart}{namePart}";
    }

    public static string TemplatesKey(Guid userId, string version = "v0", bool? isActive = null, string? name = null, int? templateType = null, bool getDetail = false)
    {
        var activePart = isActive.HasValue ? $":act={isActive.Value}" : ":act=all";
        var namePart = !string.IsNullOrWhiteSpace(name) ? $":n={name.Trim().ToLowerInvariant()}" : string.Empty;
        var typePart = templateType.HasValue ? $":t={templateType.Value}" : string.Empty;
        var detailPart = getDetail ? ":d=1" : string.Empty;
        return $"{userId}:templates:{version}{activePart}{namePart}{typePart}{detailPart}";
    }

    // Dashboard Analytics & Balances
    public static string CurrencyBalancesKey(Guid userId) => $"{userId}:dashboard:balances";
    public static string ActiveBankBalancesKey(Guid userId) => $"{userId}:dashboard:bank-balances";
    public static string MarkerPeriodsKey(Guid userId, Guid markerId) => $"{userId}:dashboard:marker-periods:{markerId}";
    public static string IncomeOutcomeLatestPeriodsKey(Guid userId, bool isMonthly) => $"{userId}:dashboard:income-outcome:{isMonthly}";

    // Reports
    public static string ReportIncomeOutcomeKey(Guid userId, int year, string? currencyId = null, string? tag = null)
    {
        var curr = !string.IsNullOrWhiteSpace(currencyId) ? currencyId.Trim() : "default";
        var t = !string.IsNullOrWhiteSpace(tag) ? tag.Trim().ToLowerInvariant() : "all";
        return $"{userId}:report:income-outcome:{year}:{curr}:{t}";
    }
}
