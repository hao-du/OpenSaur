namespace OpenSaur.CoreGate.Web.Infrastructure.Configuration;

public sealed class TurnstileOptions
{
    public const string SectionName = "Turnstile";

    public string SiteKey { get; init; } = string.Empty;

    public string SecretKey { get; init; } = string.Empty;
}
