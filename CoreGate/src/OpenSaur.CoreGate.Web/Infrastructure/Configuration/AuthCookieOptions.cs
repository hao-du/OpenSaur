namespace OpenSaur.CoreGate.Web.Infrastructure.Configuration;

public sealed class AuthCookieOptions
{
    public const string SectionName = "AuthCookies";

    public string? Domain { get; set; }
}
