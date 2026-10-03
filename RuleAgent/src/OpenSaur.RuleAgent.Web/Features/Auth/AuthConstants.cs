namespace OpenSaur.RuleAgent.Web.Features.Auth;

public static class AuthConstants
{
    public const string DefaultCookieScheme = "RuleAgentAuthCookie";
    public const string DefaultOidcScheme = "RuleAgentAuthOidc";

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
