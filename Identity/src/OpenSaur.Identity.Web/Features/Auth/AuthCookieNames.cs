namespace OpenSaur.Identity.Web.Features.Auth;

public static class AuthCookieNames
{
    // Keep the auth cookie name compact because it is sent on every authenticated request.
    public const string Session = "s";
    public const string Refresh = "r";
}
