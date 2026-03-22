namespace OpenSaur.Identity.Web.Infrastructure.Security;

public sealed class FirstPartyAuthOptions
{
    public const string SectionName = "FirstPartyAuth";

    public string Audience { get; set; } = string.Empty;

    public int AccessTokenLifetimeMinutes { get; set; } = 60;

    public int RefreshTokenLifetimeDays { get; set; } = 14;

    public string RefreshCookieName { get; set; } = "opensaur.identity.refresh";

    public string SigningKey { get; set; } = string.Empty;
}
