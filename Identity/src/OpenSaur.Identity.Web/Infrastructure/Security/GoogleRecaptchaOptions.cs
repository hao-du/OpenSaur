namespace OpenSaur.Identity.Web.Infrastructure.Security;

public sealed class GoogleRecaptchaOptions
{
    public const string SectionName = "GoogleRecaptchaV3";

    public bool Enabled { get; set; }

    public string SiteKey { get; set; } = string.Empty;

    public string SecretKey { get; set; } = string.Empty;

    public double MinimumScore { get; set; } = 0.5d;

    public string LoginAction { get; set; } = "login";

    public bool IsConfigured =>
        Enabled
        && !string.IsNullOrWhiteSpace(SiteKey)
        && !string.IsNullOrWhiteSpace(SecretKey);
}
