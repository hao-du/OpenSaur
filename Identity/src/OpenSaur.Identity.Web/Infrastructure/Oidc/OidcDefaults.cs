namespace OpenSaur.Identity.Web.Infrastructure.Oidc;

public static class OidcDefaults
{
    public static readonly TimeSpan AccessTokenLifetime = TimeSpan.FromHours(1);

    public static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(14);
}
