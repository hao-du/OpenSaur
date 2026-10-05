namespace OpenSaur.Brainbubby.Web.Features.Auth;

public static class AuthConstants
{
    public const string DefaultCookieScheme = "BrainbubbyAuthCookie";
    public const string DefaultOidcScheme = "BrainbubbyAuthOidc";

    public static class Policies
    {
        public const string RequireAuthenticatedUser = "RequireAuthenticatedUser";
        public const string RequireSuperAdministrator = "RequireSuperAdministrator";
    }

    public static class Roles
    {
        public const string SuperAdministrator = "SuperAdministrator";
    }
}
