using OpenIddict.Abstractions;

namespace OpenSaur.CoreGate.Web.Infrastructure.Security;

public static class ScopeConstants
{
    public static readonly string[] Supported =
    [
        OpenIddictConstants.Scopes.OpenId,
        OpenIddictConstants.Scopes.Profile,
        OpenIddictConstants.Scopes.Email,
        OpenIddictConstants.Scopes.OfflineAccess,
        OpenIddictConstants.Scopes.Roles,
        "api"
    ];

    public const string Api = "api";
}
