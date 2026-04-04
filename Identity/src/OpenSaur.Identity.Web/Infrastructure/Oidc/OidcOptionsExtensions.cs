namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public static class OidcOptionsExtensions
{
    public static string[] GetFirstPartyScopes(this OidcOptions oidcOptions)
    {
        return oidcOptions.GetHostedIdentityClient().Scope
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }
}
