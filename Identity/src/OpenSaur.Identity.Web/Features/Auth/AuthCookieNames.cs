namespace OpenSaur.Identity.Web.Features.Auth;

public static class AuthCookieNames
{
    // Short cookie keys keep the auth cookie header smaller, which matters because
    // both the access token and refresh token are stored in cookies for the web shell.
    public const string Session = "s";
    public const string Refresh = "r";
}
