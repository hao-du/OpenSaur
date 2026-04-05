using OpenSaur.Identity.Web.Domain.Common;

namespace OpenSaur.Identity.Web.Domain.Oidc;

public sealed class OidcClient : AuditedEntity
{
    public string AppPathBase { get; set; } = "/";

    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public string Scope { get; set; } = "openid profile email roles offline_access api";

    public List<OidcClientOrigin> Origins { get; set; } = [];
}
